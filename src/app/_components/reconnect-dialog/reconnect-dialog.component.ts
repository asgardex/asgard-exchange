import { Component, Inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { KeystoreService } from 'src/app/_services/keystore.service';
import { OverlaysService } from 'src/app/_services/overlays.service';
import { UserService } from 'src/app/_services/user.service';

@Component({
  selector: 'app-reconnect-dialog',
  templateUrl: './reconnect-dialog.component.html',
  styleUrls: ['./reconnect-dialog.component.scss']
})
export class ReconnectDialogComponent implements OnInit {

  keystorePassword: string;
  keystoreError: boolean;
  keystoreConnecting: boolean;
  // keystore;

  constructor(
    // @Inject(MAT_DIALOG_DATA) public data,
    // private dialogRef: MatDialogRef<ReconnectDialogComponent>,
    private keystoreService: KeystoreService,
    private userService: UserService,
    public overlayService: OverlaysService
  ) {
    this.keystoreConnecting = false;
    // this.keystore = data.keystore;
  }

  @Input() keystore: any;

  ngOnInit(): void {
  }

  async keystoreUnlockClicked() {

    this.keystoreConnecting = true;

    setTimeout(() => {
      this.keystoreUnlock();
    }, 100);

  }

  async keystoreUnlock() {
    this.keystoreError = false;

    try {
      localStorage.setItem('keystore', JSON.stringify(this.keystore));
      const user = await this.keystoreService.unlockKeystore(this.keystore, this.keystorePassword);
      this.userService.setUser(user);
      this.overlayService.setCurrentView('Swap');
    } catch (error) {
      this.keystoreConnecting = false;
      this.keystoreError = true;
      console.error(error);
    }
  }

  forgetKeystore() {
    this.overlayService.setCurrentView('Swap');
    localStorage.clear();
  }

}
