import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { assetAmount, assetToBase, baseAmount } from '@thorchain/asgardex-util';
import { Subscription } from 'rxjs';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { User } from 'src/app/_classes/user';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { TransactionStatusService, TxActions, TxStatus } from 'src/app/_services/transaction-status.service';
import { UserService } from 'src/app/_services/user.service';

@Component({
  selector: 'app-confim-send',
  templateUrl: './confim-send.component.html',
  styleUrls: ['./confim-send.component.scss']
})
export class ConfimSendComponent implements OnInit, OnDestroy {

  @Input() asset: AssetAndBalance;
  @Input() amount: number;
  @Input() recipientAddress: string;
  @Output() back: EventEmitter<null>;
  @Output() transactionSuccessful: EventEmitter<null>;

  user: User;
  subs: Subscription[];
  txState: TransactionConfirmationState;

  constructor(private userService: UserService, private txStatusService: TransactionStatusService) {
    this.back = new EventEmitter<null>();
    this.transactionSuccessful = new EventEmitter<null>();
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;

    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );

    this.subs = [user$];

  }

  ngOnInit(): void {
  }

  submitTransaction() {

    this.txState = TransactionConfirmationState.SUBMITTING;

    if (this.user.type === 'keystore') {
      this.submitKeystoreTransaction();
    }

  }

  async submitKeystoreTransaction() {

    if (this.asset && this.asset.asset) {

      if (this.asset.asset.chain === 'THOR') {

        const client = this.user.clients.thorchain;
        if (!client) {
          console.error('no thorchain client found');
          return;
        }

        try {

          const fees = await client.getFees();
          // const amount = this.amount - fees.average.amount().toNumber();
          const test = assetToBase(assetAmount(this.amount)).amount().toNumber();

          const hash = await client.transfer({
            // amount: assetToBase(assetAmount(amount)),
            amount: baseAmount(test - fees.average.amount().toNumber()),
            recipient: this.recipientAddress,
          });

          this.txStatusService.addTransaction({
            chain: 'THOR',
            hash,
            ticker: this.asset.asset.ticker,
            status: TxStatus.COMPLETE,
            action: TxActions.SEND
          });
          this.transactionSuccessful.next();
        } catch (error) {
          console.error('error making transfer: ', error);
          this.txState = TransactionConfirmationState.ERROR;
        }

      } else if (this.asset.asset.chain === 'BNB') {

        const binanceClient = this.user.clients.binance;

        try {
          const hash = await binanceClient.transfer({
            asset: this.asset.asset,
            amount: assetToBase(assetAmount(this.amount)),
            recipient: this.recipientAddress,
          });

          this.txStatusService.addTransaction({
            chain: 'BNB',
            hash,
            ticker: this.asset.asset.ticker,
            status: TxStatus.COMPLETE,
            action: TxActions.SEND
          });
          this.transactionSuccessful.next();
        } catch (error) {
          console.error('error making transfer: ', error);
          this.txState = TransactionConfirmationState.ERROR;
        }

      } else if (this.asset.asset.chain === 'BTC') {

        const bitcoinClient = this.user.clients.bitcoin;

        try {

          const feeRates = await bitcoinClient.getFeeRates();
          const fees = await bitcoinClient.getFees();
          const toBase = assetToBase(assetAmount(this.amount));
          const amount = toBase.amount().minus(fees.average.amount());

          const hash = await bitcoinClient.transfer({
            amount: baseAmount(amount),
            recipient: this.recipientAddress,
            feeRate: feeRates.average
          });

          this.txStatusService.addTransaction({
            chain: 'BTC',
            hash,
            ticker: 'BTC',
            status: TxStatus.PENDING,
            action: TxActions.SEND
          });
          this.transactionSuccessful.next();
        } catch (error) {
          console.error('error making transfer: ', error);
          this.txState = TransactionConfirmationState.ERROR;
        }

      }

    }

  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
