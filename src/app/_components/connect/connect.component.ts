import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { User } from 'src/app/_classes/user';
import { MetamaskService } from 'src/app/_services/metamask.service';
import { UserService } from 'src/app/_services/user.service';
import { environment } from 'src/environments/environment';
import { ethers } from 'ethers';
import { combineLatest, Subscription } from 'rxjs';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.scss'],
})
export class ConnectComponent implements OnInit, OnDestroy {
  modalDimensions = {
    maxWidth: '520px',
    width: '50vw',
    minWidth: '260px',
  };
  metaMaskProvider: ethers.providers.Web3Provider;
  subs: Subscription[];

  constructor(
    private dialog: MatDialog,
    private metaMaskService: MetamaskService,
    private userService: UserService
  ) {
    this.subs = [];
  }

  ngOnInit() {
    const user$ = this.userService.user$;
    const metaMaskProvider$ = this.metaMaskService.provider$;
    const combined = combineLatest([user$, metaMaskProvider$]);
    const subs = combined.subscribe(async ([_user, _metaMaskProvider]) => {
      if (_metaMaskProvider) {
        const accounts = await _metaMaskProvider.listAccounts();
        if (accounts.length > 0 && !_user) {
          const signer = _metaMaskProvider.getSigner();
          const address = await signer.getAddress();
          const user = new User({
            type: 'metamask',
            wallet: address,
          });
          this.userService.setUser(user);
        }
      } else {
        console.log('metamask provider is null');
      }
    });

    this.subs = [subs];
  }

  openDialog() {
    this.dialog.open(ConnectModal, this.modalDimensions);
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}

export enum ConnectionMethod {
  LEDGER = 'LEDGER',
  KEYSTORE = 'KEYSTORE',
  KEYSTORE_CREATE = 'KEYSTORE_CREATE',
  WALLET_CONNECT = 'WALLET_CONNECT',
  XDEFI = 'XDEFI',
}
export enum ConnectionView {
  KEYSTORE_CONNECT = 'KEYSTORE_CONNECT',
  KEYSTORE_CREATE = 'KEYSTORE_CREATE',
  KEYSTORE_WRITE_PHRASE = 'KEYSTORE_WRITE_PHRASE',
  XDEFI = 'XDEFI',
}

@Component({
  selector: 'app-connect-modal',
  templateUrl: 'connect-modal.component.html',
  styleUrls: ['./connect.component.scss'],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class ConnectModal {
  connectionView: ConnectionView;
  isTestnet: boolean;
  isXDEFIConnected: boolean;
  phrase: string;

  constructor(
    public dialogRef: MatDialogRef<ConnectModal>,
    private metaMaskService: MetamaskService
  ) {
    this.isTestnet = environment.network === 'testnet' ? true : false;

    this.isXDEFIConnected = false;
    if ((window as any).xfi) {
      this.isXDEFIConnected = true;
    }
  }

  createKeystore(): void {
    this.connectionView = ConnectionView.KEYSTORE_CREATE;
  }

  connectKeystore(): void {
    this.connectionView = ConnectionView.KEYSTORE_CONNECT;
  }

  connectXDEFI() {
    if (!this.isXDEFIConnected) {
      return window.open('https://www.xdefi.io', '_blank');
    }
    this.connectionView = ConnectionView.XDEFI;
  }

  async connectMetaMask(): Promise<void> {
    await this.metaMaskService.connect();
    this.dialogRef.close();
  }

  storePhrasePrompt(phrase: string) {
    this.phrase = phrase;
    this.connectionView = ConnectionView.KEYSTORE_WRITE_PHRASE;
  }

  clearConnectionMethod(): void {
    this.phrase = null;
    this.connectionView = null;
  }

  close(): void {
    this.phrase = null;
    this.dialogRef.close();
  }
}
