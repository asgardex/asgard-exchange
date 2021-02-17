import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { assetAmount, assetToBase } from '@xchainjs/xchain-util';
import { MultiTransfer } from '@xchainjs/xchain-binance';
import { Subscription } from 'rxjs';
import { User } from 'src/app/_classes/user';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { MidgardService } from 'src/app/_services/midgard.service';
import { TransactionStatusService, TxActions, TxStatus } from 'src/app/_services/transaction-status.service';
import { UserService } from 'src/app/_services/user.service';

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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmCreatePoolData,
    public dialogRef: MatDialogRef<ConfirmPoolCreateComponent>,
    private userService: UserService,
    private midgardService: MidgardService,
    private txStatusService: TransactionStatusService
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
