import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { UserService } from 'src/app/_services/user.service';

@Component({
  selector: 'app-upgrade-bnb-rune',
  templateUrl: './upgrade-bnb-rune.component.html',
  styleUrls: ['./upgrade-bnb-rune.component.scss']
})
export class UpgradeBnbRuneComponent implements OnInit {

  @Input() asset: AssetAndBalance;
  @Output() back: EventEmitter<null>;
  @Output() confirmUpgrade: EventEmitter<{amount: number}>;
  get amount() {
    return this._amount;
  }
  set amount(val: number) {
    this._amount = val;
    if (val) {
      this.checkSpendable();
    } else {
      this.amountSpendable = false;
    }
  }
  private _amount: number;
  amountSpendable: boolean;
  subs: Subscription[];
  balance: number;

  constructor(private userService: UserService) {
    this.back = new EventEmitter<null>();
    this.confirmUpgrade = new EventEmitter<{amount: number}>();
    this.amountSpendable = false;
  }

  ngOnInit(): void {
    if (this.asset) {

      const balances$ = this.userService.userBalances$.subscribe(
        (balances) => {
          this.balance = this.userService.findBalance(balances, this.asset.asset);
        }
      );

      this.subs = [balances$];

    }
  }

  checkSpendable(): void {
    const maximumSpendableBalance = this.userService.maximumSpendableBalance(this.asset.asset, this.balance);
    this.amountSpendable = (this.amount <= maximumSpendableBalance);
  }

}
