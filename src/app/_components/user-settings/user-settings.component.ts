import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
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
  @Input() overlay: boolean;
  @Output() overlayChange = new EventEmitter<boolean>();
  showMenu: boolean;

  constructor(private dialog: MatDialog, private txStatusService: TransactionStatusService) {
    this.pendingTxCount = 0;
    this.showMenu = false;
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
    // this.dialog.open(
    //   UserSettingsDialogComponent,
    //   this.modalDimensions
    // );
    this.overlayChange.emit(!this.overlay)
  }

  toggleMenu() {
    this.showMenu = !(this.showMenu)
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
