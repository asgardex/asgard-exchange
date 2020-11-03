import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { User } from 'src/app/_classes/user';
import { UserService } from 'src/app/_services/user.service';

@Component({
  selector: 'app-send-asset',
  templateUrl: './send-asset.component.html',
  styleUrls: ['./send-asset.component.scss']
})
export class SendAssetComponent implements OnInit, OnDestroy {

  @Output() back: EventEmitter<null>;
  @Output() confirmSend: EventEmitter<{amount: number, recipientAddress: string}>;
  @Input() asset: AssetAndBalance;

  get amount() {
    return this._amount;
  }
  set amount(val: number) {
    this._amount = val;
    this.checkSpendable();
  }
  private _amount: number;
  recipientAddress: string;
  balance: number;
  amountSpendable: boolean;
  user: User;
  subs: Subscription[];

  constructor(private userService: UserService) {
    this.recipientAddress = '';
    this.back = new EventEmitter<null>();
    this.confirmSend = new EventEmitter<{amount: number, recipientAddress: string}>();
    this.amountSpendable = false;
  }

  ngOnInit(): void {

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {
        this.balance = this.userService.findBalance(balances, this.asset.asset);
      }
    );

    this.subs = [balances$];

  }

  checkSpendable(): void {
    this.amountSpendable = (this.amount < this.userService.maximumSpendableBalance(this.asset.asset, this.balance));
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
