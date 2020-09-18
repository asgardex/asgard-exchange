import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StakeComponent } from './stake.component';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AssetInputModule } from '../_components/asset-input/asset-input.module';
import { ConfirmStakeModalComponent } from './confirm-stake-modal/confirm-stake-modal.component';
import { TransactionProcessingModalModule } from '../_components/transaction-processing-modal/transaction-processing-modal.module';
import { TransactionSuccessModalModule } from '../_components/transaction-success-modal/transaction-success-modal.module';



@NgModule({
  declarations: [StakeComponent, ConfirmStakeModalComponent],
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
        component: StakeComponent
      },
      {
        path: '',
        redirectTo: '/pool'
      }
    ])
  ]
})
export class StakeModule { }
