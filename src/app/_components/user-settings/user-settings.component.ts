import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from 'src/app/_classes/user';
import { TransactionStatusService } from 'src/app/_services/transaction-status.service';
import { UserSettingsDialogComponent } from './user-settings-dialog/user-settings-dialog.component';
import { UserService } from 'src/app/_services/user.service';
import { MainViewsEnum, OverlaysService } from 'src/app/_services/overlays.service';

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
  currentView: MainViewsEnum;

  constructor(private txStatusService: TransactionStatusService, private userService: UserService, public overlaysService: OverlaysService) {
    this.pendingTxCount = 0;
    this.showMenu = false;
    const pendingTx$ = this.txStatusService.txs$.subscribe(
      (_txs) => {
        this.pendingTxCount = this.txStatusService.getPendingTxCount();
      }
    );
    this.subs = [pendingTx$];

    this.overlaysService.currentView.subscribe(val => {
      this.currentView = val;
    })
  }

  ngOnInit(): void {
  }

  openUserSettings() {
    // this.overlayChange.emit(!this.overlay);
    if (this.currentView == MainViewsEnum.UserSetting)
      this.overlaysService.setCurrentView(MainViewsEnum.Swap)
    else
      this.overlaysService.setCurrentView(MainViewsEnum.UserSetting);
  }

  openAccountSetting() {
    if (this.currentView == MainViewsEnum.AccountSetting)
      this.overlaysService.setCurrentView(MainViewsEnum.Swap)
    else
      this.overlaysService.setCurrentView(MainViewsEnum.AccountSetting);
  }

  openTransaction() {
    if (this.currentView == MainViewsEnum.Transaction)
      this.overlaysService.setCurrentView(MainViewsEnum.Swap)
    else
      this.overlaysService.setCurrentView(MainViewsEnum.Transaction);
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
