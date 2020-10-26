import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { User } from 'src/app/_classes/user';
import { PendingTransaction, UserService } from 'src/app/_services/user.service';
import { environment } from 'src/environments/environment';
import { MidgardService } from 'src/app/_services/midgard.service';

import { Subject, Subscription, of, timer } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { TransactionDTO } from 'src/app/_classes/transaction';
import { WalletConnectService } from 'src/app/_services/wallet-connect.service';
import { BlockchairBtcTransactionDTO, BlockchairService } from 'src/app/_services/blockchair.service';
import { UserSettingsComponent } from './user-settings/user-settings.component';
import { PendingTxsModalComponent } from '../pending-txs-modal/pending-txs-modal.component';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.scss']
})
export class ConnectComponent implements OnInit, OnDestroy {

  user: User;
  subs: Subscription[];
  pendingTxs: PendingTransaction[];
  killTxPolling: {[key: string]: Subject<void>} = {};

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private midgardService: MidgardService,
    private blockchairService: BlockchairService,
    private walletConnectService: WalletConnectService
  ) {

    // this.pendingTxCount = 0;
    this.pendingTxs = [];

    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );

    const pendingTx$ = this.userService.pendingTransaction$.subscribe(
      (pendingTxs) => {

        if (pendingTxs) {

          for (const tx of pendingTxs) {

            const exists = this.pendingTxs.includes(tx);

            if (!exists) {

              this.killTxPolling[tx.hash] = new Subject();

              if (tx.chain === 'BNB') {
                this.pollBnbTx(tx);
              } else if (tx.chain === 'BTC') {
                this.pollBtcTx(tx);
              }

              this.pendingTxs.push(tx);

            }

          }

        }

      }
    );

    this.subs = [user$, pendingTx$];
  }

  ngOnInit(): void {
    this.walletConnectService.initWalletConnect();
  }

  pollBtcTx(tx: PendingTransaction) {
    const refreshInterval$ = timer(0, 5000)
    .pipe(
      // This kills the request if the user closes the component
      takeUntil(this.killTxPolling[tx.hash]),
      // switchMap cancels the last request, if no response have been received since last tick
      switchMap(() => this.blockchairService.getBitcoinTransaction(tx.hash)),
      // catchError handles http throws
      catchError(error => of(error))
    ).subscribe( async (res: BlockchairBtcTransactionDTO) => {


      if (res && res.data && res.data[tx.hash] && res.data[tx.hash].transaction
        && res.data[tx.hash].transaction.block_id && res.data[tx.hash].transaction.block_id > 0) {
          this.killTxPolling[tx.hash].next();
          this.userService.removePendingTransaction(tx);
          this.pendingTxs = this.pendingTxs.filter( (pending) => pending !== tx );
          await this.userService.fetchBalances(this.user);
      }

    });
    this.subs.push(refreshInterval$);
  }

  pollBnbTx(tx: PendingTransaction) {
    const refreshInterval$ = timer(0, 5000)
    .pipe(
      // This kills the request if the user closes the component
      takeUntil(this.killTxPolling[tx.hash]),
      // switchMap cancels the last request, if no response have been received since last tick
      switchMap(() => this.midgardService.getTransaction(tx.hash)),
      // catchError handles http throws
      catchError(error => of(error))
    ).subscribe( async (res: TransactionDTO) => {

      if (res && res.txs && res.txs.length > 0) {

        if (res.txs[0].status === 'Success') {

          await this.userService.fetchBalances(this.user);

          this.killTxPolling[tx.hash].next();
          this.userService.removePendingTransaction(tx);
          this.pendingTxs = this.pendingTxs.filter( (pending) => pending !== tx );

        }

      }

    });
    this.subs.push(refreshInterval$);
  }

  openDialog() {
    this.dialog.open(
      ConnectModal,
      {
        maxWidth: '420px',
        width: '50vw',
        minWidth: '260px'
      }
    );
  }

  openUserSettings() {
    this.dialog.open(
      UserSettingsComponent,
      {
        maxWidth: '420px',
        width: '50vw',
        minWidth: '260px'
      }
    );
  }

  openPendingTxs() {
    this.dialog.open(
      PendingTxsModalComponent,
      {
        maxWidth: '420px',
        width: '50vw',
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
  LEDGER          = 'LEDGER',
  KEYSTORE        = 'KEYSTORE',
  KEYSTORE_CREATE = 'KEYSTORE_CREATE',
  WALLET_CONNECT  = 'WALLET_CONNECT',
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
  selectedChain: 'BNB' | 'BTC';

  constructor(
    public dialogRef: MatDialogRef<ConnectModal>,
    private walletConnectService: WalletConnectService,
    private userService: UserService
  ) {
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

  setSelectedChain(chain: 'BNB' | 'BTC') {
    this.selectedChain = chain;
  }

  connectWalletConnect() {
    this.walletConnectService.connectWalletConnect();
  }

  createKeystore() {
    this.connectionMethod = ConnectionMethod.KEYSTORE_CREATE;
  }

  connectKeystore() {
    this.connectionMethod = ConnectionMethod.KEYSTORE;
  }

  connectLedger() {
    this.connectionMethod = ConnectionMethod.LEDGER;
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
