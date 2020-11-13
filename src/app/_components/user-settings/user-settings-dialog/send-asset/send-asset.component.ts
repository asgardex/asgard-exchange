import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { User } from 'src/app/_classes/user';
import { CGCoinListItem, CoinGeckoService } from 'src/app/_services/coin-gecko.service';
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
  coinGeckoList: CGCoinListItem[];

  constructor(private userService: UserService, private cgService: CoinGeckoService) {
    this.recipientAddress = '';
    this.back = new EventEmitter<null>();
    this.confirmSend = new EventEmitter<{amount: number, recipientAddress: string}>();
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

    this.getCoinGeckoCoinList();

  }

  getCoinGeckoCoinList() {

    this.cgService.getCoinList().subscribe( (res) => {
      this.coinGeckoList = res;
    });

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
