import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { Market } from 'src/app/_classes/market';
import { MidgardService } from 'src/app/_services/midgard.service';
import { UserService } from 'src/app/_services/user.service';
import { Asset } from '../../_classes/asset';
import { AssetBalance } from '../../_classes/asset-balance';
import { Subscription } from 'rxjs';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { User } from 'src/app/_classes/user';
import { Balance, Balances } from '@xchainjs/xchain-client';
// import { baseToToken, TokenAmount, tokenAmount } from '@thorchain/asgardex-token';
import { assetAmount, AssetAmount, baseAmount, BaseAmount, baseToAsset } from '@thorchain/asgardex-util';

type AssetAndBalance = {
  asset: Asset,
  // balance?: AssetBalance,
  // balance?: {
  //   asset: Asset;
  //   amount: TokenAmount;
  //   frozenAmount?: BaseAmount;
  // }
  balance?: AssetAmount;
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
  // userBalances: AssetBalance[];
  userBalances: Balances;
  subs: Subscription[];
  loading: boolean;
  user: User;

  constructor(
    private userService: UserService,
    private midgardService: MidgardService,
    @Inject(MAT_DIALOG_DATA) public data: { disabledAssetSymbol: string },
    public dialogRef: MatDialogRef<MarketsModalComponent>
  ) {

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
    this.getPools();
  }

  sortMarketsByUserBalance(): void {
    // Sort first by user balances
    if (this.userBalances) {

      console.log('user balances is: ', this.userBalances);

      const balMap: {[key: string]: Balance} = {};
      this.userBalances.forEach((item) => {
        balMap[`${item.asset.chain}.${item.asset.symbol}`] = item;
      });

      console.log('balMap is: ', balMap);

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

  getPools() {
    this.loading = true;
    this.midgardService.getPools().subscribe(
      async (res) => {
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

        if (this.user && this.user.clients) {

          // let balances: Balances = [];

          // // for (const [key, _value] of Object.entries(this.user.clients)) {
          // //   const client = this.user.clients[key];
          // //   const clientBalances = await client.getBalance();
          // //   balances = [...balances, ...clientBalances];
          // // }

          // this.userBalances = balances;
          this.userService.fetchBalances(this.user);

        } else {
          this.userBalances = [];
        }

        this.sortMarketsByUserBalance();
        this.loading = false;

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
