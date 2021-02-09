import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Asset } from 'src/app/_classes/asset';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { UserService } from 'src/app/_services/user.service';
import { NativeRunePromptModalComponent } from './native-rune-prompt-modal/native-rune-prompt-modal.component';

@Component({
  selector: 'app-native-rune-prompt',
  templateUrl: './native-rune-prompt.component.html',
  styleUrls: ['./native-rune-prompt.component.scss']
})
export class NativeRunePromptComponent implements OnInit, OnDestroy {

  subs: Subscription[];
  nonNativeRuneAssets: AssetAndBalance[];

  constructor(private userService: UserService, private dialog: MatDialog) {

    this.nonNativeRuneAssets = [];

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {

        if (balances) {
          const nonNativeRuneAssets = balances.filter( (balance) => {

            return (balance.asset.chain === 'BNB' && balance.asset.ticker === 'RUNE')
              || (balance.asset.chain === 'ETH' && balance.asset.ticker === 'RUNE');

          }).map( (balance) => ({
            asset: new Asset(`${balance.asset.chain}.${balance.asset.symbol}`)
          }));

          this.nonNativeRuneAssets = this.userService.sortMarketsByUserBalance(balances, nonNativeRuneAssets);

        } else {
          this.nonNativeRuneAssets = [];
        }

      }
    );

    this.subs = [balances$];

  }

  ngOnInit(): void {
  }

  launchModal() {
    const dialogRef = this.dialog.open(
      NativeRunePromptModalComponent,
      {
        width: '50vw',
        maxWidth: '420px',
        minWidth: '260px',
        data: {
          assets: this.nonNativeRuneAssets,
        }
      }
    );
  }

  ngOnDestroy(): void {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
