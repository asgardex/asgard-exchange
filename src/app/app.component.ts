import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, timer, of, Subscription } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { LastBlock } from 'src/app/_classes/last-block';
import { LastBlockService } from 'src/app/_services/last-block.service';
import { MidgardService } from 'src/app/_services/midgard.service';
import { ReconnectDialogComponent } from './_components/reconnect-dialog/reconnect-dialog.component';
import { environment } from 'src/environments/environment';
import { OverlaysService } from './_services/overlays.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  killPolling: Subject<void> = new Subject();
  subs: Subscription[];
  isTestnet: boolean;
  showSwap: boolean;
  _showUserSetting: boolean;
  _showReconnect: boolean;
  keystore: any;

  // get showUserSetting() {
  //   return this.overlaysService.getCurrentView() === 'User Setting'
  // }
  // set showUserSetting(val: boolean) {
  //   if(val === true)
  //     this.overlaysService.setCurrentView('User Setting')
  //   if (val === false)
  //     this.overlaysService.setCurrentView('Testnet')
  // }

  // get showReconnect() {
  //   return this.overlaysService.getCurrentView() === 'Reconnect'
  // }
  // set showReconnect(val: boolean) {
  //   console.log('show connect again :', val)
  //   if(val === true)
  //     this.overlaysService.setCurrentView('Reconnect')
  //   if (val === false)
  //     this.overlaysService.setCurrentView('Testnet')
  // }

  // get isTestnet() {
  //   return this.overlaysService.getCurrentView() === 'Testnet'
  // }
  // set isTestnet(val: boolean) {
  //   if(val === true)
  //     this.overlaysService.setCurrentView('Testnet')
  // }


  constructor(
    // private dialog: MatDialog,
    private midgardService: MidgardService,
    private lastBlockService: LastBlockService,
    public overlaysService: OverlaysService
  ) {
    this.subs = [];
    this.isTestnet = (environment.network === 'testnet');
    this.overlaysService.setCurrentView('Swap')
    // this.showUserSetting = false;
    // this.showReconnect = false
  }

  ngOnInit(): void {
    this.pollLastBlock();

    const keystoreString = localStorage.getItem('keystore');
    const keystore = JSON.parse(keystoreString);
    if (keystore) {
      this.keystore = keystore;
      this.openReconnectDialog();
    }
  }

  openReconnectDialog() {
    //TODO: this needs to be shown every time keystroke has been find
    // this.showReconnect = true;
    this.overlaysService.setCurrentView('Reconnect')
    // this.dialog.open(
    //   ReconnectDialogComponent,
    //   {
    //     maxWidth: '420px',
    //     width: '50vw',
    //     minWidth: '260px',
    //     data: {
    //       keystore
    //     }
    //   }
    // );
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
