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

  constructor(
    private dialog: MatDialog,
    private midgardService: MidgardService,
    private lastBlockService: LastBlockService,
    private userService: UserService
  ) {
    this.isTestnet = (environment.network === 'testnet');

    const chainBalanceErrors$ = this.userService.chainBalanceErrors$.subscribe(
      (chains) => this.chainBalanceErrors = chains
    );

    this.subs = [chainBalanceErrors$];
  }

  ngOnInit(): void {
    this.pollLastBlock();

    const keystoreString = localStorage.getItem('keystore');
    const keystore = JSON.parse(keystoreString);
    if (keystore) {
      this.openReconnectDialog(keystore);
    }
  }

  openReconnectDialog(keystore) {
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
