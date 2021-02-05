import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MultiTransfer } from '@xchainjs/xchain-binance';
import { assetAmount, assetToBase } from '@xchainjs/xchain-util';
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
import { Client as binanceClient } from '@xchainjs/xchain-binance';
import { Client as bitcoinClient } from '@xchainjs/xchain-bitcoin';

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

    this.midgardService.getInboundAddresses().subscribe(
      async (res) => {

        if (res && res.length > 0) {

          this.deposit(res);

          // const bnbPool = currentPools.find( (pool) => pool.chain === 'BNB' );
          // const btcPool = currentPools.find( (pool) => pool.chain === 'BTC' );

          // if (this.data.asset.chain === 'BNB') {

          //   console.log('RUNE AMOUNT IS: ', assetToBase(assetAmount(this.data.runeAmount)).amount().toNumber());
          //   console.log('ASSET AMOUNT IS: ', assetToBase(assetAmount(this.data.assetAmount)).amount().toNumber());

          //   const outputs: MultiTransfer[] = [
          //     {
          //       to: bnbPool.address,
          //       coins: [
          //         {
          //           asset: this.data.rune,
          //           amount: assetToBase(assetAmount(this.data.runeAmount))
          //           // amount: (this.data.user.type === 'keystore' || this.data.user.type === 'ledger')
          //           //   ? assetToBase(assetAmount(this.data.runeAmount))
          //           //   : assetToBase(assetAmount(this.data.runeAmount)),
          //         },
          //         {
          //           asset: this.data.asset,
          //           amount: assetToBase(assetAmount(this.data.assetAmount))
          //           // amount: (this.data.user.type === 'keystore' || this.data.user.type === 'ledger')
          //           //   ? assetToBase(assetAmount(this.data.assetAmount))
          //           //   : assetToBase(assetAmount(this.data.assetAmount))
          //         },
          //       ],
          //     },
          //   ];

          //   const memo = `STAKE:BNB.${this.data.asset.symbol}`;

          //   if (bnbPool) {
          //     if (this.data.user.type === 'keystore' || this.data.user.type === 'ledger') {
          //       this.singleChainBnbKeystoreTx(outputs, memo);
          //     } else if (this.data.user.type === 'walletconnect') {
          //       this.walletConnectTransaction(outputs, memo, bnbPool);
          //     }
          //   }

          // } else if (this.data.asset.chain === 'BTC') {
          //   this.multichainKeystoreTx(btcPool, bnbPool);
          // }

        }

      }
    );
  }


  async deposit(pools: PoolAddressDTO[]) {

    const clients = this.data.user.clients;
    const asset = this.data.asset;
    const thorClient = clients.thorchain;
    const thorchainAddress = await thorClient.getAddress();
    let client: binanceClient | bitcoinClient;
    let address: string;
    let recipientPool: PoolAddressDTO;
    let feeRate;

    switch (this.data.asset.chain) {
      case 'BNB':
        client = clients.binance;
        recipientPool = pools.find( (pool) => pool.chain === 'BNB' );
        feeRate = 0.000375;
        break;

      case 'BTC':
        client = clients.bitcoin;
        recipientPool = pools.find( (pool) => pool.chain === 'BTC' );
        const feeRates = await client.getFeeRates();
        feeRate = feeRates.average;
        break;
    }

    if (!client || !recipientPool) {
      console.error('cannot find client or recipient pool');
      return;
    }

    address = await client.getAddress();
    const runeMemo = `+:${asset.chain}.${asset.symbol}:${address}`;
    const targetTokenMemo = `+:${asset.chain}.${asset.symbol}:${thorchainAddress}`;

    // deposit RUNE
    try {
      const hash = await thorClient.deposit({
        amount: assetToBase(assetAmount(this.data.runeAmount)),
        memo: runeMemo,
      });

      this.hash = hash;
      this.txStatusService.addTransaction({
        chain: 'THOR',
        hash: this.hash,
        ticker: 'RUNE',
        status: TxStatus.PENDING,
        action: TxActions.DEPOSIT
      });
    } catch (error) {
      console.error('error making RUNE transfer: ', error);
      this.txState = TransactionConfirmationState.ERROR;
    }

    // deposit token
    try {


      const hash = await client.transfer({
        amount: assetToBase(assetAmount(this.data.assetAmount)),
        recipient: recipientPool.address,
        memo: targetTokenMemo,
        feeRate
      });

      this.hash = hash;
      this.txStatusService.addTransaction({
        chain: asset.chain,
        hash: this.hash,
        ticker: asset.ticker,
        status: TxStatus.PENDING,
        action: TxActions.DEPOSIT
      });
    } catch (error) {
      console.error('error making token transfer: ', error);
      this.txState = TransactionConfirmationState.ERROR;
    }

    this.txState = TransactionConfirmationState.SUCCESS;

  }

  /** currently deprecated */
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
