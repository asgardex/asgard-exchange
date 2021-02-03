import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { Market } from 'src/app/_classes/market';
import { UserService } from 'src/app/_services/user.service';
import { Asset } from '../../_classes/asset';
import { Subscription } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from 'src/app/_classes/user';
import { Balance, Balances } from '@xchainjs/xchain-client';
import { baseToAsset } from '@xchainjs/xchain-util';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';


@Component({
  selector: 'app-markets-modal',
  templateUrl: './markets-modal.component.html',
  styleUrls: ['./markets-modal.component.scss'],
})
export class MarketsModalComponent implements OnInit, OnDestroy {
  get searchTerm(): string {
    return this._searchTerm;
  }
  set searchTerm(term: string) {
    this._searchTerm = term;

    if (term && term.length > 0) {
      this.filteredMarketListItems = this.marketListItems.filter((item) => {
        const search = term.toUpperCase();
        return item.asset.symbol.includes(search);
      });
    } else {
      this.filteredMarketListItems = this.marketListItems;
    }
  }
  _searchTerm: string;
  markets: Market[] = [];
  marketListItems: AssetAndBalance[];
  filteredMarketListItems: AssetAndBalance[];
  // userBalances: AssetBalance[];
  userBalances: Balances;
  subs: Subscription[];
  loading: boolean;
  user: User;

  constructor(
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: { disabledAssetSymbol: string, selectableMarkets: AssetAndBalance[] },
    public dialogRef: MatDialogRef<MarketsModalComponent>
  ) {

    this.marketListItems = this.data.selectableMarkets;

    const user$ = this.userService.user$.subscribe(
      (user) => {
        this.user = user;
      }
    );

    const balances$ = this.userService.userBalances$.subscribe( (balances) => {
      this.userBalances = balances;
      if (this.marketListItems) {
        this.sortMarketsByUserBalance();
      }
    });

    this.subs = [user$, balances$];
  }

  ngOnInit(): void {
    this.initList();
  }

  sortMarketsByUserBalance(): void {
    // Sort first by user balances
    if (this.userBalances && this.marketListItems) {

      const balMap: {[key: string]: Balance} = {};
      this.userBalances.forEach((item) => {
        balMap[`${item.asset.chain}.${item.asset.symbol}`] = item;
      });

      this.marketListItems = this.marketListItems.map((mItem) => {

        if (balMap[`${mItem.asset.chain}.${mItem.asset.symbol}`]) {
          return {
            asset: mItem.asset,
            balance: baseToAsset(balMap[`${mItem.asset.chain}.${mItem.asset.symbol}`].amount),
          };
        }
        else {
          return {
            asset: mItem.asset,
          };
        }

      });

      this.marketListItems = this.marketListItems.sort((a, b) => {
        if (!a.balance && !b.balance) { return 0; }
        if (!a.balance) { return 1; }
        if (!b.balance) { return -1; }
        return (
          b.balance.amount().toNumber() - a.balance.amount().toNumber()
        );
      });
      this.filteredMarketListItems = this.marketListItems;
    }
  }


  initList() {

    this.filteredMarketListItems = this.marketListItems;

    if (this.user && this.user.clients) {
      this.userService.fetchBalances();
    } else {
      this.userBalances = [];
    }

    this.sortMarketsByUserBalance();

  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

  selectItem(item: Asset) {
    if (item.symbol !== this.data.disabledAssetSymbol) {
      this.dialogRef.close(item);
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
