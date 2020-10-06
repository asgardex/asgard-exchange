import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnstakeComponent } from './unstake.component';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { ConfirmUnstakeModalComponent } from './confirm-unstake-modal/confirm-unstake-modal.component';
import { TransactionSuccessModalModule } from '../_components/transaction-success-modal/transaction-success-modal.module';
import { TransactionProcessingModalModule } from '../_components/transaction-processing-modal/transaction-processing-modal.module';
import { IconTickerModule } from '../_components/icon-ticker/icon-ticker.module';


@NgModule({
  declarations: [UnstakeComponent, ConfirmUnstakeModalComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSliderModule,
    FormsModule,
    TransactionSuccessModalModule,
    TransactionProcessingModalModule,
    IconTickerModule,
    RouterModule.forChild([
      {
        path: ':asset',
        component: UnstakeComponent
      },
      {
        path: '',
        redirectTo: '/pool'
      }
    ])
  ]
})
export class UnstakeModule { }
