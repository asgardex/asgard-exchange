import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { Market } from 'src/app/_classes/market';
import { UserService } from 'src/app/_services/user.service';
import { Asset } from '../../_classes/asset';
import { Subscription } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from 'src/app/_classes/user';
import { Balances } from '@xchainjs/xchain-client';
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
  userBalances: Balances;
  subs: Subscription[];
  loading: boolean;
  user: User;

  constructor(
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      disabledAssetSymbol: string;
      selectableMarkets: AssetAndBalance[];
    },
    public dialogRef: MatDialogRef<MarketsModalComponent>
  ) {
    this.marketListItems = this.data.selectableMarkets;

    const user$ = this.userService.user$.subscribe((user) => {
      this.user = user;
      if (!user) {
        this.userBalances = [];
      }
    });

    const balances$ = this.userService.userBalances$.subscribe((balances) => {
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
      this.marketListItems = this.userService.sortMarketsByUserBalance(
        this.userBalances,
        this.marketListItems
      );
      this.filteredMarketListItems = this.marketListItems;
    }
  }

  initList() {
    this.filteredMarketListItems = this.marketListItems;
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
