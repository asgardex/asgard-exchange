import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from 'src/app/_services/user.service';
// import { Market } from '@thorchain/asgardex-binance';
import { MarketResponse, Market } from 'src/app/_classes/market';
import { MidgardService } from 'src/app/_services/midgard.service';
import { MarketListItem } from './markets-list-item';
import { Subscription } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-markets-modal',
  templateUrl: './markets-modal.component.html',
  styleUrls: ['./markets-modal.component.scss']
})
export class MarketsModalComponent implements OnInit, OnDestroy {

  searchTerm: string;
  markets: Market[] = [];
  marketListItems: MarketListItem[];
  subs: Subscription[];

  constructor(
    private userService: UserService,
    private midgardService: MidgardService,
    public dialogRef: MatDialogRef<MarketsModalComponent>) {

      // const markets$ = this.userService.markets$.subscribe(
      //   (markets) => {
      //     this.markets = markets;
      //   }
      // );

      this.subs = [];

  }

  ngOnInit(): void {
    this.getPools();
  }

  getPools() {
    this.midgardService.getPools().subscribe(
      (res) => {
        // this.pools = res;

        const sortedByName = res.sort();

        // export const RUNE_SYMBOL = isMainnet ? 'RUNE-B1A' : 'RUNE-67C';

        this.marketListItems = sortedByName.map( (poolName) => new MarketListItem(poolName) );
        this.marketListItems.unshift(
          new MarketListItem(environment.network === 'chaosnet' ? 'RUNE-B1A' : 'RUNE-67C')
        );
        console.log('market list items are: ', this.marketListItems);
      },
      (err) => console.error('error fetching pools: ', err)
    );
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

  selectItem(item: MarketListItem) {

    this.dialogRef.close(item);

  }

  closeDialog() {
    this.dialogRef.close();
  }

}
