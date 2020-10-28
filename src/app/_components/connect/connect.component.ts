import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { User } from 'src/app/_classes/user';
import { UserService } from 'src/app/_services/user.service';
import { environment } from 'src/environments/environment';
import { Subject, Subscription } from 'rxjs';
import { WalletConnectService } from 'src/app/_services/wallet-connect.service';
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
        this.pendingTxCount = this.txStatusService.getPendingTxCount();
      }
    );

    // this.pendingTxCount = 2;

    this.subs = [user$, pendingTx$];
  }

  ngOnInit(): void {
    this.walletConnectService.initWalletConnect();
  }

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
