import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UserService } from 'src/app/_services/user.service';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
import { WalletConnectService } from 'src/app/_services/wallet-connect.service';


@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.scss']
})
export class ConnectComponent implements OnInit {

  // modalDimensions = {
  //   maxWidth: '420px',
  //   width: '50vw',
  //   minWidth: '260px'
  // };

  constructor(private dialog: MatDialog, private walletConnectService: WalletConnectService) { }

  @Input() overlay: boolean;
  @Output() overlayChange = new EventEmitter<boolean>();

  ngOnInit(): void {
    this.walletConnectService.initWalletConnect();
  }

  openDialog() {
    // this.dialog.open(
    //   ConnectModal,
    //   this.modalDimensions
    // );
    this.overlayChange.emit(true);
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
    // public dialogRef: MatDialogRef<ConnectModal>,
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

  @Input() overlay: boolean;
  @Output() overlayChange = new EventEmitter<boolean>();

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
    // this.dialogRef.close();
    this.overlayChange.emit(false);
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
