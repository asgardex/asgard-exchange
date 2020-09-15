import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { User } from 'src/app/_classes/user';
import { UserService } from 'src/app/_services/user.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.scss']
})
export class ConnectComponent implements OnInit, OnDestroy {

  user: User;
  subs: Subscription[];

  constructor(private dialog: MatDialog, private userService: UserService) {
    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );
    this.subs = [user$];
  }

  ngOnInit(): void {
  }

  openDialog() {
    this.dialog.open(
      ConnectModal,
      {
        width: '50vw',
        maxWidth: '420px'
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
export class ConnectModal {

  connectionMethod: ConnectionMethod;
  isTestnet: boolean;

  constructor(public dialogRef: MatDialogRef<ConnectModal>) {
    this.isTestnet = environment.network === 'testnet' ? true : false;
  }

  connectWalletConnect() {
    this.connectionMethod = ConnectionMethod.WALLET_CONNECT;
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

}
