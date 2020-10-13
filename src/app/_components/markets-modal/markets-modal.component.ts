import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { Market } from 'src/app/_classes/market';
import { MidgardService } from 'src/app/_services/midgard.service';
import { UserService } from 'src/app/_services/user.service';
import { Asset } from '../../_classes/asset';
import { AssetBalance } from '../../_classes/asset-balance';
import { Subscription } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';

type AssetAndBalance = {
  asset: Asset,
  balance?: AssetBalance,
};

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
  userBalances: AssetBalance[];
  subs: Subscription[];
  loading: boolean;

  constructor(
    private userService: UserService,
    private midgardService: MidgardService,
    @Inject(MAT_DIALOG_DATA) public data: { disabledAssetSymbol: string },
    public dialogRef: MatDialogRef<MarketsModalComponent>
  ) {
    this.subs = [];
  }

  ngOnInit(): void {
    this.getPools();
  }

  sortMarketsByUserBalance(): void {
    // Sort first by user balances
    if (this.userBalances) {
      const balMap = {};
      this.userBalances.forEach((item) => {
        balMap[item.asset] = item;
      });

      this.marketListItems = this.marketListItems.map((mItem) => {
        return {
          asset: mItem.asset,
          balance: balMap[mItem.asset.symbol],
        };
      });
      this.marketListItems = this.marketListItems.sort((a, b) => {
        if (!a.balance && !b.balance) { return 0; }
        if (!a.balance) { return 1; }
        if (!b.balance) { return -1; }
        return (
          b.balance.assetValue.amount().toNumber() -
          a.balance.assetValue.amount().toNumber()
        );
      });
      this.filteredMarketListItems = this.marketListItems;
    }
  }

  getPools() {
    this.loading = true;
    this.midgardService.getPools().subscribe(
      (res) => {
        const sortedByName = res.sort();

        this.marketListItems = sortedByName.map((poolName) => ({
          asset: new Asset(poolName),
        }));

        // Keeping RUNE at top by default
        this.marketListItems.unshift({
          asset: new Asset(
            environment.network === 'chaosnet' ? 'BNB.RUNE-B1A' : 'BNB.RUNE-67C'
          ),
        });
        this.filteredMarketListItems = this.marketListItems;

        this.userService.userBalances$.subscribe((balances) => {
          this.userBalances = balances;
          this.sortMarketsByUserBalance();
          this.loading = false;
        });
      },
      (err) => console.error('error fetching pools: ', err)
    );
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
