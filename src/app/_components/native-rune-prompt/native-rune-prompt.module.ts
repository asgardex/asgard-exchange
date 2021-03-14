import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NativeRunePromptComponent } from './native-rune-prompt.component';
import { MatIconModule } from '@angular/material/icon';
import { NativeRunePromptModalComponent } from './native-rune-prompt-modal/native-rune-prompt-modal.component';
import { AssetsListModule } from '../assets-list/assets-list.module';
import { UpgradeRuneModule } from '../upgrade-rune/upgrade-rune.module';
import { UpgradeRuneConfirmModule } from '../upgrade-rune-confirm/upgrade-rune-confirm.module';
import { TransactionSuccessModalModule } from '../transaction-success-modal/transaction-success-modal.module';
import { NotificationComponent } from '../notification/notification.component';
import { BreadcrumbModule } from '../breadcrumb/breadcrumb.module';



@NgModule({
  declarations: [NativeRunePromptComponent, NativeRunePromptModalComponent, NotificationComponent],
  imports: [
    CommonModule,
    MatIconModule,
    AssetsListModule,
    UpgradeRuneModule,
    UpgradeRuneConfirmModule,
    TransactionSuccessModalModule,
    BreadcrumbModule
  ],
  exports: [NativeRunePromptComponent, NativeRunePromptModalComponent]
})
export class NativeRunePromptModule { }
