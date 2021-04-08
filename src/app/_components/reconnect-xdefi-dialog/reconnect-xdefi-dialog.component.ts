import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserService } from 'src/app/_services/user.service';
import { XDEFIService } from 'src/app/_services/xdefi.service';

@Component({
  selector: 'app-reconnect-xdefi-dialog',
  templateUrl: './reconnect-xdefi-dialog.component.html',
  styleUrls: ['./reconnect-xdefi-dialog.component.scss'],
})
export class ReconnectXDEFIDialogComponent implements OnInit {
  connecting: boolean;
  connectingError: boolean;
  listProviders: typeof XDEFIService.listProvider;
  isValidNetwork: boolean;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    private dialogRef: MatDialogRef<ReconnectXDEFIDialogComponent>,
    private userService: UserService,
    private xdefiService: XDEFIService
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.listProviders = this.xdefiService.listEnabledXDFIProviders();
      this.isValidNetwork = this.xdefiService.isValidNetwork();
    }, 200)
  }

  async initConnect() {
    try {
      this.connecting = true;
      const user = await this.xdefiService.connectXDEFI();
      this.userService.setUser(user);
      this.dialogRef.close();
    } catch (error) {
      this.connecting = false;
      this.connectingError = true;
      console.error(error);
    }
  }

  forget() {
    localStorage.clear();
    this.dialogRef.close();
  }
}
