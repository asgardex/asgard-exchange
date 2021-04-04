import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, timer, of, Subscription } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { LastBlock } from 'src/app/_classes/last-block';
import { LastBlockService } from 'src/app/_services/last-block.service';
import { MidgardService } from 'src/app/_services/midgard.service';
import { ReconnectDialogComponent } from './_components/reconnect-dialog/reconnect-dialog.component';
import { environment } from 'src/environments/environment';
import { UserService } from './_services/user.service';
import { Chain } from '@xchainjs/xchain-util';
import { AssetAndBalance } from './_classes/asset-and-balance';
import { Asset } from './_classes/asset';
import { ReconnectXDEFIDialogComponent } from './_components/reconnect-xdefi-dialog/reconnect-xdefi-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  killPolling: Subject<void> = new Subject();
  subs: Subscription[];
  isTestnet: boolean;
  chainBalanceErrors: Chain[];
  nonNativeRuneAssets: AssetAndBalance[];

  constructor(
    private dialog: MatDialog,
    private midgardService: MidgardService,
    private lastBlockService: LastBlockService,
    private userService: UserService,
  ) {
    this.isTestnet = (environment.network === 'testnet');

    const chainBalanceErrors$ = this.userService.chainBalanceErrors$.subscribe(
      (chains) => this.chainBalanceErrors = chains
    );

    this.nonNativeRuneAssets = [];

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {

        if (balances) {
          const nonNativeRuneAssets = balances
          // get ETH.RUNE and BNB.RUNE
          .filter( (balance) => {

            return (balance.asset.chain === 'BNB' && balance.asset.ticker === 'RUNE')
              || (balance.asset.chain === 'ETH' && balance.asset.ticker === 'RUNE');

          })
          // filter out 0 amounts
          .filter( balance => balance.amount.amount().isGreaterThan(0))
          // create Asset
          .map( (balance) => ({
            asset: new Asset(`${balance.asset.chain}.${balance.asset.symbol}`)
          }));

          this.nonNativeRuneAssets = this.userService.sortMarketsByUserBalance(balances, nonNativeRuneAssets);

        } else {
          this.nonNativeRuneAssets = [];
        }

      }
    );

    this.subs = [chainBalanceErrors$, balances$];
  }

  async ngOnInit(): Promise<void> {
    this.pollLastBlock();

    const keystoreString = localStorage.getItem('keystore');
    const XDEFIConnected = localStorage.getItem('XDEFI_CONNECTED');

    const keystore = JSON.parse(keystoreString);
    if (keystore) {
      this.openReconnectDialog(keystore);
    } else if (XDEFIConnected) {
      this.openReconnectXDEFIDialog();
    }
  }

  notificationsExist(): boolean {
    return ( (this.nonNativeRuneAssets && this.nonNativeRuneAssets.length > 0)
      || (this.chainBalanceErrors && this.chainBalanceErrors.length > 0));
  }

  openReconnectDialog(keystore?) {
    this.dialog.open(
      ReconnectDialogComponent,
      {
        maxWidth: '420px',
        width: '50vw',
        minWidth: '260px',
        data: {
          keystore
        }
      }
    );
  }

  openReconnectXDEFIDialog() {
    this.dialog.open(
      ReconnectXDEFIDialogComponent,
      {
        maxWidth: '420px',
        width: '50vw',
        minWidth: '260px',
      }
    );
  }

  pollLastBlock(): void {
    const refreshInterval$ = timer(0, 15000)
    .pipe(
      // This kills the request if the user closes the component
      takeUntil(this.killPolling),
      // switchMap cancels the last request, if no response have been received since last tick
      switchMap(() => this.midgardService.getLastBlock()),
      // catchError handles http throws
      catchError(error => of(error))
    ).subscribe( async (res: LastBlock[]) => {
      if (res.length > 0) {
        this.lastBlockService.setBlock(res[0].thorchain);
      }
    });
    this.subs.push(refreshInterval$);
  }

  ngOnDestroy(): void {
    this.killPolling.next();
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
