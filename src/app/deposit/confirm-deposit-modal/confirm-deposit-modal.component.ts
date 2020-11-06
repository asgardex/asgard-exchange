import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MultiTransfer } from '@xchainjs/xchain-binance';
import { assetAmount, assetToBase } from '@thorchain/asgardex-util';
import { Subscription } from 'rxjs';
import { PoolAddressDTO } from 'src/app/_classes/pool-address';
import { User } from 'src/app/_classes/user';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { BinanceService } from 'src/app/_services/binance.service';
import { MidgardService } from 'src/app/_services/midgard.service';
import { UserService } from 'src/app/_services/user.service';
import { WalletConnectService } from 'src/app/_services/wallet-connect.service';
import { environment } from 'src/environments/environment';
import { TransactionStatusService, TxActions, TxStatus } from 'src/app/_services/transaction-status.service';

export interface ConfirmDepositData {
  asset;
  rune;
  assetAmount: number;
  runeAmount: number;
  user: User;
  runeBasePrice: number;
  assetBasePrice: number;
}

@Component({
  selector: 'app-confirm-deposit-modal',
  templateUrl: './confirm-deposit-modal.component.html',
  styleUrls: ['./confirm-deposit-modal.component.scss']
})
export class ConfirmDepositModalComponent implements OnInit, OnDestroy {

  txState: TransactionConfirmationState;
  hash: string;
  subs: Subscription[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDepositData,
    public dialogRef: MatDialogRef<ConfirmDepositModalComponent>,
    private walletConnectService: WalletConnectService,
    private txStatusService: TransactionStatusService,
    private midgardService: MidgardService,
    private userService: UserService,
    private binanceService: BinanceService
  ) {
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;
    const user$ = this.userService.user$.subscribe(
      (user) => {
        if (!user) {
          this.closeDialog();
        }
      }
    );

    this.subs = [user$];
  }

  ngOnInit(): void {
  }

  submitTransaction(): void {
    this.txState = TransactionConfirmationState.SUBMITTING;

    this.midgardService.getProxiedPoolAddresses().subscribe(
      async (res) => {

        const currentPools = res.current;

        if (currentPools && currentPools.length > 0) {

          const bnbPool = currentPools.find( (pool) => pool.chain === 'BNB' );
          const btcPool = currentPools.find( (pool) => pool.chain === 'BTC' );

          if (this.data.asset.chain === 'BNB') {

            console.log('RUNE AMOUNT IS: ', assetToBase(assetAmount(this.data.runeAmount)).amount().toNumber());
            console.log('ASSET AMOUNT IS: ', assetToBase(assetAmount(this.data.assetAmount)).amount().toNumber());

            const outputs: MultiTransfer[] = [
              {
                to: bnbPool.address,
                coins: [
                  {
                    asset: this.data.rune,
                    amount: (this.data.user.type === 'keystore' || this.data.user.type === 'ledger')
                      ? assetToBase(assetAmount(this.data.runeAmount))
                      : assetToBase(assetAmount(this.data.runeAmount)),
                  },
                  {
                    asset: this.data.asset,
                    amount: (this.data.user.type === 'keystore' || this.data.user.type === 'ledger')
                      ? assetToBase(assetAmount((this.data.assetAmount)))
                      : assetToBase(assetAmount(this.data.assetAmount))
                  },
                ],
              },
            ];

            const memo = `STAKE:BNB.${this.data.asset.symbol}`;

            if (bnbPool) {
              if (this.data.user.type === 'keystore' || this.data.user.type === 'ledger') {
                this.singleChainBnbKeystoreTx(outputs, memo);
              } else if (this.data.user.type === 'walletconnect') {
                this.walletConnectTransaction(outputs, memo, bnbPool);
              }
            }

          } else if (this.data.asset.chain === 'BTC') {
            this.multichainKeystoreTx(btcPool, bnbPool);
          }

        }

      }
    );
  }

  async singleChainBnbKeystoreTx(outputs, memo: string) {

    // const bncClient = this.binanceService.bncClient;

    // await bncClient.initChain();

    // if (this.data.user.type === 'ledger') {

    //   bncClient.useLedgerSigningDelegate(
    //     this.data.user.ledger,
    //     () => this.txState = TransactionConfirmationState.PENDING_LEDGER_CONFIRMATION,
    //     () => this.txState = TransactionConfirmationState.SUBMITTING,
    //     (err) => {
    //       this.txState = TransactionConfirmationState.ERROR;
    //       console.error('useLedgerSigningDelegate error: ', err);
    //     },
    //     this.data.user.hdPath
    //   );
    // }

    const binanceClient = this.data.user.clients.binance;
    if (binanceClient) {

      try {
        const hash = await binanceClient.multiSend({transactions: outputs, memo});
        this.txState = TransactionConfirmationState.SUCCESS;
        this.hash = hash;
        this.txStatusService.addTransaction({
          chain: 'BNB',
          hash: this.hash,
          ticker: this.data.asset.ticker,
          status: TxStatus.PENDING,
          action: TxActions.DEPOSIT
        });
      } catch (error) {
        console.error('error making transfer: ', error);
        this.txState = TransactionConfirmationState.ERROR;
      }

    } else {
      console.error('no binance client for user');
    }

  }

  async multichainKeystoreTx(corePool: PoolAddressDTO, bnbPool: PoolAddressDTO) {
    const binanceClient = this.data.user.clients.binance;
    const bitcoinClient = this.data.user.clients.bitcoin;
    const bitcoinAddress = await bitcoinClient.getAddress();
    const binanceAddress = await binanceClient.getAddress();
    const asset = this.data.asset;

    const coreChainMemo = `STAKE:${asset.chain}.${asset.symbol}:${binanceAddress}`;
    const bnbMemo = `STAKE:${asset.chain}.${asset.symbol}:${bitcoinAddress}`;

    // send RUNE
    try {
      const hash = await binanceClient.transfer({
        asset: this.data.rune,
        amount: assetToBase(assetAmount(this.data.runeAmount)),
        recipient: bnbPool.address,
        memo: bnbMemo
      });

      this.hash = hash;
      this.txStatusService.addTransaction({
        chain: 'BNB',
        hash: this.hash,
        ticker: 'RUNE',
        status: TxStatus.PENDING,
        action: TxActions.DEPOSIT
      });
    } catch (error) {
      console.error('error making transfer: ', error);
      this.txState = TransactionConfirmationState.ERROR;
      return;
    }

    // send BTC
    try {
      const hash = await bitcoinClient.transfer({
        amount: assetToBase(assetAmount(this.data.assetAmount)),
        recipient: corePool.address,
        memo: coreChainMemo,
      });

      this.hash = hash;
      this.txStatusService.addTransaction({
        chain: 'BTC',
        hash: this.hash,
        ticker: 'BTC',
        status: TxStatus.PENDING,
        action: TxActions.DEPOSIT
      });
      this.txState = TransactionConfirmationState.SUCCESS;
    } catch (error) {
      console.error('error making transfer: ', error);
      this.txState = TransactionConfirmationState.ERROR;
    }

  }

  walletConnectTransaction(outputs: MultiTransfer[], memo: string, matchingPool: PoolAddressDTO) {

    const sendOrder = this.walletConnectService.walletConnectGetSendOrderMsg({
      fromAddress: this.data.user.wallet,
      toAddress: matchingPool.address,
      coins: outputs[0].coins
    });

    const bncClient = this.binanceService.bncClient;

    /**
     * TODO: clean up, this is used in confirm-swap-modal as well
     */
    bncClient
      .getAccount(this.data.user.wallet)
      .then(async (response) => {
        if (!response) {
          console.error('error getting response from getAccount');
          return;
        }

        const account = response.result;
        const chainId = environment.network === 'testnet' ? 'Binance-Chain-Nile' : 'Binance-Chain-Tigris';
        const tx = {
          accountNumber: account.account_number.toString(),
          sequence: account.sequence.toString(),
          send_order: sendOrder,
          chainId,
          memo,
        };

        const res = await this.walletConnectService.walletConnectSendTx(tx, bncClient);

        if (res) {
          this.txState = TransactionConfirmationState.SUCCESS;

          if (res.result && res.result.length > 0) {
            this.hash = res.result[0].hash;
            this.txStatusService.addTransaction({
              chain: 'BNB',
              hash: this.hash,
              ticker: this.data.asset.ticker,
              status: TxStatus.PENDING,
              action: TxActions.DEPOSIT
            });
          }
        }

    })
    .catch((error) => {
      console.error('getAccount error: ', error);
    });
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
