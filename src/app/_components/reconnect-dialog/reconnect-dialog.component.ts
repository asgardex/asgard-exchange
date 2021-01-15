import { Component, Inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { KeystoreService } from 'src/app/_services/keystore.service';
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
    private userService: UserService
  ) {
    this.keystoreConnecting = false;
    // this.keystore = data.keystore;
  }

  @Input() reconnect: boolean;
  @Output() reconnectChange = new EventEmitter<boolean>();
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
      // this.dialogRef.close();
      this.reconnect = false;
      this.reconnectChange.emit(this.reconnect);
    } catch (error) {
      this.keystoreConnecting = false;
      this.keystoreError = true;
      console.error(error);
    }
  }

  forgetKeystore() {
    this.reconnect = false;
    console.log(this.reconnect)
    this.reconnectChange.emit(this.reconnect);
    localStorage.clear();
    // this.dialogRef.close();
  }

}
