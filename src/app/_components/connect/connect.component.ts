import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { User } from 'src/app/_classes/user';
import { UserService } from 'src/app/_services/user.service';
import { environment } from 'src/environments/environment';
import { MidgardService } from 'src/app/_services/midgard.service';

import { Subject, Subscription, of, timer } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { TransactionDTO } from 'src/app/_classes/transaction';
import { WalletService } from 'src/app/_services/wallet.service';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.scss']
})
export class ConnectComponent implements OnInit, OnDestroy {

  user: User;
  subs: Subscription[];
  pendingTxCount: number;
  killTxPolling: Subject<void> = new Subject();

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private midgardService: MidgardService,
    private walletService: WalletService
  ) {

    this.pendingTxCount = 0;

    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );

    const pendingTx$ = this.userService.pendingTransaction$.subscribe(
      (txId) => {
        console.log('pending tx in connect is: ', txId);
        this.pollTx(txId);
        this.pendingTxCount++;
      }
    );

    this.subs = [user$, pendingTx$];
  }

  ngOnInit(): void {
    this.walletService.initWalletConnect();
  }

  pollTx(txId: string) {
    const refreshInterval$ = timer(0, 5000)
    .pipe(
      // This kills the request if the user closes the component
      takeUntil(this.killTxPolling),
      // switchMap cancels the last request, if no response have been received since last tick
      switchMap(() => this.midgardService.getTransaction(txId)),
      // catchError handles http throws
      catchError(error => of(error))
    ).subscribe( async (res: TransactionDTO) => {

      if (res && res.txs && res.txs.length > 0) {

        if (res.txs[0].status === 'Success') {

          await this.userService.getBalance(this.user.wallet);

          this.pendingTxCount--;
          if (this.pendingTxCount <= 0) {
            this.killTxPolling.next();
          }

        }

      }

    });
    this.subs.push(refreshInterval$);
  }

  getTransaction() {
    // this.midgardService.getTransaction()
  }

  openDialog() {
    this.dialog.open(
      ConnectModal,
      {
        // width: '50vw',
        // maxWidth: '420px'
        minWidth: '260px'
      }
    );
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}

export enum ConnectionMethod {
  WALLET_CONNECT  = 'WALLET_CONNECT',
  KEYSTORE        = 'KEYSTORE'
}

@Component({
  selector: 'app-connect-modal',
  templateUrl: 'connect-modal.component.html',
  styleUrls: ['./connect.component.scss']
})
// tslint:disable-next-line:component-class-suffix
export class ConnectModal implements OnDestroy {

  connectionMethod: ConnectionMethod;
  isTestnet: boolean;
  subs: Subscription[];

  constructor(public dialogRef: MatDialogRef<ConnectModal>, private walletService: WalletService, private userService: UserService) {
    this.isTestnet = environment.network === 'testnet' ? true : false;

    const user$ = this.userService.user$.subscribe(
      (user) => {
        if (user) {
          this.close();
        }
      }
    );

    this.subs = [user$];

  }

  connectWalletConnect() {
    this.walletService.connectWalletConnect();
  }

  connectKeystore() {
    this.connectionMethod = ConnectionMethod.KEYSTORE;
  }

  clearConnectionMethod() {
    this.connectionMethod = null;
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
