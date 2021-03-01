import { Component, Inject, OnInit } from '@angular/core';
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
  keystore;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    private dialogRef: MatDialogRef<ReconnectDialogComponent>,
    private keystoreService: KeystoreService,
    private userService: UserService
  ) {
    this.keystoreConnecting = false;
    this.keystore = data.keystore;
  }

  ngOnInit(): void {
  }

  async initUnlock() {

    if (this.keystoreConnecting) {
      return;
    }

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
      this.dialogRef.close();
    } catch (error) {
      this.keystoreConnecting = false;
      this.keystoreError = true;
      console.error(error);
    }
  }

  forgetKeystore() {
    localStorage.clear();
    this.dialogRef.close();
  }

}
