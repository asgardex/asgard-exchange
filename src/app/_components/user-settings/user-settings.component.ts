import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { User } from 'src/app/_classes/user';
import { TransactionStatusService } from 'src/app/_services/transaction-status.service';
import { UserSettingsDialogComponent } from './user-settings-dialog/user-settings-dialog.component';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss']
})
export class UserSettingsComponent implements OnInit, OnDestroy {

  @Input() user: User;
  pendingTxCount: number;
  modalDimensions = {
    maxWidth: '420px',
    width: '50vw',
    minWidth: '260px'
  };
  subs: Subscription[];

  constructor(private dialog: MatDialog, private txStatusService: TransactionStatusService) {
    this.pendingTxCount = 0;
    const pendingTx$ = this.txStatusService.txs$.subscribe(
      (_txs) => {
        this.pendingTxCount = this.txStatusService.getPendingTxCount();
      }
    );
    this.subs = [pendingTx$];
  }

  ngOnInit(): void {
  }

  openUserSettings() {
    this.dialog.open(
      UserSettingsDialogComponent,
      this.modalDimensions
    );
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
