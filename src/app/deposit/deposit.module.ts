import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DepositComponent } from './deposit.component';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AssetInputModule } from '../_components/asset-input/asset-input.module';
import { ConfirmDepositModalComponent } from './confirm-deposit-modal/confirm-deposit-modal.component';
import { TransactionProcessingModalModule } from '../_components/transaction-processing-modal/transaction-processing-modal.module';
import { TransactionSuccessModalModule } from '../_components/transaction-success-modal/transaction-success-modal.module';



@NgModule({
  declarations: [DepositComponent, ConfirmDepositModalComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    AssetInputModule,
    TransactionSuccessModalModule,
    TransactionProcessingModalModule,
    RouterModule.forChild([
      {
        path: ':asset',
        component: DepositComponent
      },
      {
        path: '',
        redirectTo: '/pool'
      }
    ])
  ]
})
export class DepositModule { }
