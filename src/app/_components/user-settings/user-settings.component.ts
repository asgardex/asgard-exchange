import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from 'src/app/_classes/user';
import { TransactionStatusService } from 'src/app/_services/transaction-status.service';
import { UserSettingsDialogComponent } from './user-settings-dialog/user-settings-dialog.component';
import { UserService } from 'src/app/_services/user.service';
import { OverlaysService } from 'src/app/_services/overlays.service';

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

  constructor(private txStatusService: TransactionStatusService, private userService: UserService, public overlayService: OverlaysService) {
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
    // this.overlayChange.emit(!this.overlay);
    if (this.overlayService.getCurrentView() === 'User Setting')
      this.overlayService.setCurrentView('Swap')
    else
      this.overlayService.setCurrentView('User Setting');
  }

  disconnect() {
    this.userService.setUser(null);
    this.overlayChange.emit(false);
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
