import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { PoolAddressDTO } from 'src/app/_classes/pool-address';
import { MidgardService } from 'src/app/_services/midgard.service';
import { UserService } from 'src/app/_services/user.service';

@Component({
  selector: 'app-upgrade-rune',
  templateUrl: './upgrade-rune.component.html',
  styleUrls: ['./upgrade-rune.component.scss'],
})
export class UpgradeRuneComponent implements OnInit {
  @Input() asset: AssetAndBalance;
  @Output() back: EventEmitter<null>;
  @Output() confirmUpgrade: EventEmitter<{ amount: number }>;
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
  inboundAddresses: PoolAddressDTO[];

  constructor(
    private userService: UserService,
    private midgardService: MidgardService
  ) {
    this.back = new EventEmitter<null>();
    this.confirmUpgrade = new EventEmitter<{ amount: number }>();
    this.amountSpendable = false;
  }

  ngOnInit(): void {
    this.setPoolAddresses();

    if (this.asset) {
      const balances$ = this.userService.userBalances$.subscribe((balances) => {
        this.balance = this.userService.findBalance(balances, this.asset.asset);
      });

      this.subs = [balances$];
    }
  }

  setPoolAddresses() {
    this.midgardService
      .getInboundAddresses()
      .subscribe((res) => (this.inboundAddresses = res));
  }

  checkSpendable(): void {
    if (!this.balance || !this.inboundAddresses || !this.asset?.asset) {
      this.amountSpendable = false;
      return;
    }

    const maximumSpendableBalance = this.userService.maximumSpendableBalance(
      this.asset.asset,
      this.balance,
      this.inboundAddresses
    );
    this.amountSpendable = this.amount <= maximumSpendableBalance;
  }
}
