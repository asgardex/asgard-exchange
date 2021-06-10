import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WithdrawComponent } from './withdraw.component';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { ConfirmWithdrawModalComponent } from './confirm-withdraw-modal/confirm-withdraw-modal.component';
import { TransactionSuccessModalModule } from '../_components/transaction-success-modal/transaction-success-modal.module';
import { TransactionProcessingModalModule } from '../_components/transaction-processing-modal/transaction-processing-modal.module';
import { IconTickerModule } from '../_components/icon-ticker/icon-ticker.module';
import { TransactionLedgerConfirmModalModule } from '../_components/transaction-ledger-confirm-modal/transaction-ledger-confirm-modal.module';
import { DirectivesModule } from '../_directives/directives.module';
import { SectionHeadModule } from '../_components/section-head/section-head.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PoolTypeOptionsModule } from '../_components/pool-type-options/pool-type-options.module';

@NgModule({
  declarations: [WithdrawComponent, ConfirmWithdrawModalComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSliderModule,
    FormsModule,
    TransactionSuccessModalModule,
    TransactionProcessingModalModule,
    TransactionLedgerConfirmModalModule,
    IconTickerModule,
    DirectivesModule,
    SectionHeadModule,
    MatTooltipModule,
    PoolTypeOptionsModule,
    RouterModule.forChild([
      {
        path: ':asset',
        component: WithdrawComponent,
      },
      {
        path: '',
        redirectTo: '/pool',
      },
    ]),
  ],
})
export class WithdrawModule {}
