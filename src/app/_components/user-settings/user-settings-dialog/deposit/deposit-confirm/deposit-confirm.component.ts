import {
  Component,
  EventEmitter,
  Output,
  Input,
  OnDestroy,
} from '@angular/core';
import { assetAmount, assetToBase } from '@xchainjs/xchain-util';
import { Subscription } from 'rxjs';
import { User } from 'src/app/_classes/user';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import {
  TransactionStatusService,
  TxActions,
  TxStatus,
} from 'src/app/_services/transaction-status.service';
import { UserService } from 'src/app/_services/user.service';
import { ActionOptions } from '../action-options.enum';

@Component({
  selector: 'app-deposit-confirm',
  templateUrl: './deposit-confirm.component.html',
  styleUrls: ['./deposit-confirm.component.scss'],
})
export class DepositConfirmComponent implements OnDestroy {
  @Input() memo: string;
  @Input() action: ActionOptions;
  @Input() depositAmount: number;
  @Output() back = new EventEmitter<null>();
  @Output() transactionSubmitted = new EventEmitter<string>();

  user: User;
  hash: string;
  error: string;
  txState: TransactionConfirmationState;
  subs: Subscription[];

  constructor(
    private userService: UserService,
    private txStatusService: TransactionStatusService
  ) {
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;

    const user$ = this.userService.user$.subscribe(
      (user) => (this.user = user)
    );

    this.subs = [user$];
  }

  async submitTransaction() {
    this.txState = TransactionConfirmationState.SUBMITTING;

    if (this.user && this.user.clients && this.user.clients.thorchain) {
      const clients = this.user.clients;
      const thorClient = clients.thorchain;

      // deposit RUNE
      try {
        const hash = await thorClient.deposit({
          amount: assetToBase(assetAmount(this.depositAmount)),
          memo: this.memo,
        });

        this.hash = hash;
        this.txStatusService.addTransaction({
          chain: 'THOR',
          hash: this.hash,
          ticker: 'RUNE',
          status: TxStatus.PENDING,
          action: TxActions.DEPOSIT,
          isThorchainTx: true,
          symbol: 'RUNE',
        });

        this.transactionSubmitted.next(hash);
      } catch (error) {
        console.error('error making RUNE transfer: ', error);
        this.txState = TransactionConfirmationState.ERROR;
      }
    }
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}
