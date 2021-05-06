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
  @Output() confirmSend: EventEmitter<{amount: number, recipientAddress: string, memo: string}>;
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
  memo: string;

  constructor(private userService: UserService) {
    this.recipientAddress = '';
    this.memo = '';
    this.back = new EventEmitter<null>();
    this.confirmSend = new EventEmitter<{amount: number, recipientAddress: string, memo: string}>();
    this.amountSpendable = false;
  }

  ngOnInit(): void {

    if (this.asset) {

      const balances$ = this.userService.userBalances$.subscribe(
        (balances) => {
          this.balance = this.userService.findBalance(balances, this.asset.asset);
        }
      );

      const user$ = this.userService.user$.subscribe(
        (user) => {
          this.user = user;
        }
      );

      this.subs = [balances$, user$];

    }

  }

  nextDisabled(): boolean {

    if (!this.user) {
      return true;
    }

    if (!this.asset) {
      return true;
    }

    const client = this.userService.getChainClient(this.user, this.asset.asset.chain);
    if (!client) {
      return true;
    }

    return !this.amountSpendable
      || !client.validateAddress(this.recipientAddress)
      || this.amount <= 0;
  }

  mainButtonText(): string {

    if (!this.user) {
      return 'Connect Wallet';
    }

    if (!this.asset) {
      return 'No Asset';
    }

    const client = this.userService.getChainClient(this.user, this.asset.asset.chain);
    if (!client) {
      return `No ${this.asset.asset.chain} Client Found`;
    }

    if (!client.validateAddress(this.recipientAddress)) {
      return `Invalid ${this.asset.asset.chain} Address`;
    }

    if (this.amount <= 0) {
      return 'Enter Amount';
    }

    if (!this.amountSpendable) {
      return 'Amount not spendable';
    }

    return 'Next';

  }

  checkSpendable(): void {
    const maximumSpendableBalance = this.userService.maximumSpendableBalance(this.asset.asset, this.balance);
    this.amountSpendable = (this.amount <= maximumSpendableBalance);
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
