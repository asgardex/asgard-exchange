import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { User } from 'src/app/_classes/user';
import { UserService } from 'src/app/_services/user.service';
import { environment } from 'src/environments/environment';
// import { MidgardService } from 'src/app/_services/midgard.service';

import { Subject, Subscription } from 'rxjs';
// import { takeUntil, switchMap, catchError } from 'rxjs/operators';
// import { TransactionDTO } from 'src/app/_classes/transaction';
import { WalletConnectService } from 'src/app/_services/wallet-connect.service';
// import { BlockchairBtcTransactionDTO, BlockchairService } from 'src/app/_services/blockchair.service';
import { UserSettingsComponent } from './user-settings/user-settings.component';
import { PendingTxsModalComponent } from '../pending-txs-modal/pending-txs-modal.component';
import { TransactionStatusService, Tx } from 'src/app/_services/transaction-status.service';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.scss']
})
export class ConnectComponent implements OnInit, OnDestroy {

  user: User;
  subs: Subscription[];
  pendingTxs: Tx[];
  pendingTxCount: number;
  killTxPolling: {[key: string]: Subject<void>} = {};
  modalDimensions = {
    maxWidth: '420px',
    width: '50vw',
    minWidth: '260px'
  };

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    // private midgardService: MidgardService,
    // private blockchairService: BlockchairService,
    private txStatusService: TransactionStatusService,
    private walletConnectService: WalletConnectService
  ) {

    this.pendingTxCount = 0;
    this.pendingTxs = [];

    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );

    const pendingTx$ = this.txStatusService.txs$.subscribe(
      (_txs) => {

        // console.log('txs are: ', txs);

        // this.pendingTxCount = txs.reduce( (count, tx) => {

        //   if (tx.status === TxStatus.PENDING) {
        //     count++;
        //   }

        //   return count;

        // }, 0);
        this.pendingTxCount = this.txStatusService.getPendingTxCount();

        // console.log('pendingTx count is: ', this.pendingTxCount);

        // if (txs) {

        //   for (const tx of txs) {

        //     const exists = this.pendingTxs.includes(tx);

        //     if (!exists) {

        //       // this.killTxPolling[tx.hash] = new Subject();

        //       // if (tx.chain === 'BNB') {
        //       //   this.pollBnbTx(tx);
        //       // } else if (tx.chain === 'BTC') {
        //       //   this.pollBtcTx(tx);
        //       // }

        //       this.pendingTxs.push(tx);

        //     }

        //   }

        // }

      }
    );

    // this.pendingTxCount = 2;

    this.subs = [user$, pendingTx$];
  }

  ngOnInit(): void {
    this.walletConnectService.initWalletConnect();

    // setTimeout(() => {
    //   this.txStatusService.addTransaction({chain: 'BNB', hash: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ', status: TxStatus.PENDING});
    //   this.txStatusService.addTransaction({chain: 'BNB', hash: 'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', status: TxStatus.PENDING});
    // }, 1000);

    // setTimeout( () => {
    //   this.txStatusService.updateTxStatus('ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ', TxStatus.COMPLETE);
    // }, 20000);

    // setTimeout( () => {
    //   this.txStatusService.updateTxStatus('YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY', TxStatus.COMPLETE);
    // }, 40000);

  }

  // pollBtcTx(tx: PendingTransaction) {
  //   const refreshInterval$ = timer(0, 5000)
  //   .pipe(
  //     // This kills the request if the user closes the component
  //     takeUntil(this.killTxPolling[tx.hash]),
  //     // switchMap cancels the last request, if no response have been received since last tick
  //     switchMap(() => this.blockchairService.getBitcoinTransaction(tx.hash)),
  //     // catchError handles http throws
  //     catchError(error => of(error))
  //   ).subscribe( async (res: BlockchairBtcTransactionDTO) => {


  //     if (res && res.data && res.data[tx.hash] && res.data[tx.hash].transaction
  //       && res.data[tx.hash].transaction.block_id && res.data[tx.hash].transaction.block_id > 0) {
  //         this.killTxPolling[tx.hash].next();
  //         this.userService.removePendingTransaction(tx);
  //         this.pendingTxs = this.pendingTxs.filter( (pending) => pending !== tx );
  //         await this.userService.fetchBalances(this.user);
  //     }

  //   });
  //   this.subs.push(refreshInterval$);
  // }

  // pollBnbTx(tx: PendingTransaction) {
  //   const refreshInterval$ = timer(0, 5000)
  //   .pipe(
  //     // This kills the request if the user closes the component
  //     takeUntil(this.killTxPolling[tx.hash]),
  //     // switchMap cancels the last request, if no response have been received since last tick
  //     switchMap(() => this.midgardService.getTransaction(tx.hash)),
  //     // catchError handles http throws
  //     catchError(error => of(error))
  //   ).subscribe( async (res: TransactionDTO) => {

  //     if (res && res.txs && res.txs.length > 0) {

  //       if (res.txs[0].status === 'Success') {

  //         await this.userService.fetchBalances(this.user);

  //         this.killTxPolling[tx.hash].next();
  //         this.userService.removePendingTransaction(tx);
  //         this.pendingTxs = this.pendingTxs.filter( (pending) => pending !== tx );

  //       }

  //     }

  //   });
  //   this.subs.push(refreshInterval$);
  // }

  openDialog() {
    this.dialog.open(
      ConnectModal,
      this.modalDimensions
    );
  }

  openUserSettings() {
    this.dialog.open(
      UserSettingsComponent,
      this.modalDimensions
    );
  }

  openPendingTxs() {
    this.dialog.open(
      PendingTxsModalComponent,
      this.modalDimensions
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
