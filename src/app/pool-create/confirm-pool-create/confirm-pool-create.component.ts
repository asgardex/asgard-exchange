import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Asset, assetAmount, assetToBase } from '@xchainjs/xchain-util';
import { MultiTransfer } from '@xchainjs/xchain-binance';
import { Subscription } from 'rxjs';
import { User } from 'src/app/_classes/user';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { MidgardService } from 'src/app/_services/midgard.service';
import { TransactionStatusService, TxActions, TxStatus } from 'src/app/_services/transaction-status.service';
import { UserService } from 'src/app/_services/user.service';
import { Client as BinanceClient } from '@xchainjs/xchain-binance';
import { PoolAddressDTO } from 'src/app/_classes/pool-address';
import { Client as EthereumClient } from '@xchainjs/xchain-ethereum/lib';
import { Client as ThorchainClient } from '@xchainjs/xchain-thorchain';
import { EthUtilsService } from 'src/app/_services/eth-utils.service';

export interface ConfirmCreatePoolData {
  asset;
  rune;
  assetAmount: number;
  runeAmount: number;
}

@Component({
  selector: 'app-confirm-pool-create',
  templateUrl: './confirm-pool-create.component.html',
  styleUrls: ['./confirm-pool-create.component.scss']
})
export class ConfirmPoolCreateComponent implements OnInit, OnDestroy {

  user: User;
  subs: Subscription[];
  txState: TransactionConfirmationState;
  hash: string;
  error: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmCreatePoolData,
    public dialogRef: MatDialogRef<ConfirmPoolCreateComponent>,
    private userService: UserService,
    private midgardService: MidgardService,
    private txStatusService: TransactionStatusService,
    private ethUtilsService: EthUtilsService
  ) {

    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;

    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );

    this.subs = [user$];

  }

  ngOnInit(): void {
  }

  submitTransaction(): void {
    this.txState = TransactionConfirmationState.SUBMITTING;

    this.midgardService.getInboundAddresses().subscribe(
      async (res) => {

        const currentPools = res;

        if (currentPools && currentPools.length > 0) {

          const bnbPool = currentPools.find( (pool) => pool.chain === 'BNB' );

          if (this.data.asset.chain === 'BNB') {

            const outputs: MultiTransfer[] = [
              {
                to: bnbPool.address,
                coins: [
                  {
                    asset: this.data.rune,
                    amount: (this.user.type === 'keystore' || this.user.type === 'ledger')
                      ? assetToBase(assetAmount(this.data.runeAmount))
                      : assetToBase(assetAmount(this.data.runeAmount)),
                  },
                  {
                    asset: this.data.asset,
                    amount: (this.user.type === 'keystore' || this.user.type === 'ledger')
                      ? assetToBase(assetAmount((this.data.assetAmount)))
                      : assetToBase(assetAmount(this.data.assetAmount))
                  },
                ],
              },
            ];

            const memo = `STAKE:BNB.${this.data.asset.symbol}`;

            if (bnbPool) {
              if (this.user.type === 'keystore' || this.user.type === 'ledger') {
                this.singleChainBnbKeystoreTx(outputs, memo);
              }
            }

          } else {
            console.log('atm only bnb pools are allowed to be created');
          }

        }

      }
    );
  }

  async keystoreDeposit(inboundAddresses: PoolAddressDTO[]) {

    const clients = this.user.clients;
    const asset = this.data.asset;
    const thorClient = clients.thorchain;
    const thorchainAddress = await thorClient.getAddress();

    // get token address
    const address = await this.userService.getTokenAddress(this.user, this.data.asset.chain);
    if (!address || address === '') {
      console.error('no address found');
      return;
    }

    // find recipient pool
    const recipientPool = inboundAddresses.find( (pool) => pool.chain === this.data.asset.chain );
    if (!recipientPool) {
      console.error('no recipient pool found');
      return;
    }


    let hash = '';

    /**
     * Deposit Token
     */
    try {

      // deposit using xchain
      switch (this.data.asset.chain) {
        case 'BNB':
          const bnbClient = this.user.clients.binance;
          hash = await this.binanceDeposit(bnbClient, thorchainAddress, recipientPool);
          break;

        case 'ETH':
          const ethClient = this.user.clients.ethereum;
          hash = await this.ethereumDeposit(ethClient, thorchainAddress, recipientPool);
          break;

        default:
          console.error(`${this.data.asset.chain} does not match`);
          return;
      }

      if (hash === '') {
        console.error('no hash set');
        return;
      }
    } catch (error) {
      console.error('error depositing asset');
      console.error(error);
      return;
    }

    /**
     * Deposit RUNE
     */
    try {
      const runeMemo = `+:${asset.chain}.${asset.symbol}:${address}`;

      const runeHash = await thorClient.deposit({
        amount: assetToBase(assetAmount(this.data.runeAmount)),
        memo: runeMemo,
      });

      this.hash = runeHash;
      this.txStatusService.addTransaction({
        chain: 'THOR',
        hash: runeHash,
        ticker: `${asset.ticker}-RUNE`,
        status: TxStatus.PENDING,
        action: TxActions.DEPOSIT,
        symbol: asset.symbol,
        isThorchainTx: true
      });
    } catch (error) {
      console.error('error making RUNE transfer: ', error);
      this.txState = TransactionConfirmationState.ERROR;
      this.error = error;
    }

  }

  async binanceDeposit(client: BinanceClient, thorchainAddress: string, recipientPool: PoolAddressDTO): Promise<string> {
    // deposit token
    try {

      const asset = this.data.asset;
      const targetTokenMemo = `+:${asset.chain}.${asset.symbol}:${thorchainAddress}`;
      const hash = await client.transfer({
        asset: {
          chain: asset.chain,
          symbol: asset.symbol,
          ticker: asset.ticker
        },
        amount: assetToBase(assetAmount(this.data.assetAmount)),
        recipient: recipientPool.address,
        memo: targetTokenMemo,
      });

      return hash;
    } catch (error) {
      throw(error);
    }
  }

  async ethereumDeposit(client: EthereumClient, thorchainAddress: string, recipientPool: PoolAddressDTO) {
    try {
      const asset = this.data.asset;
      const targetTokenMemo = `+:${asset.chain}.${asset.symbol}:${thorchainAddress}`;
      const hash = await this.ethUtilsService.callDeposit({
        inboundAddress: recipientPool,
        asset,
        memo: targetTokenMemo,
        amount: this.data.assetAmount,
        ethClient: client
      });

      return hash;
    } catch (error) {
      throw(error);
    }
  }

  async singleChainBnbKeystoreTx(outputs, memo: string) {

    const binanceClient = this.user.clients.binance;
    if (binanceClient) {

      try {
        const hash = await binanceClient.multiSend({transactions: outputs, memo});
        this.txState = TransactionConfirmationState.SUCCESS;
        this.hash = hash;
        this.txStatusService.addTransaction({
          chain: 'BNB',
          hash: this.hash,
          ticker: this.data.asset.ticker,
          symbol: this.data.asset.symbol,
          status: TxStatus.PENDING,
          action: TxActions.DEPOSIT,
          isThorchainTx: true
        });
      } catch (error) {
        console.error('error making transfer: ', error);
        this.txState = TransactionConfirmationState.ERROR;
      }

    } else {
      console.error('no binance client for user');
    }

  }

  closeDialog(transactionSucess?: boolean) {
    this.dialogRef.close(transactionSucess);
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
