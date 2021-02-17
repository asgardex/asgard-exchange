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
import { TransactionLedgerConfirmModalModule } from '../_components/transaction-ledger-confirm-modal/transaction-ledger-confirm-modal.module';
import { ApproveEthContractModule } from '../_components/approve-eth-contract/approve-eth-contract.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';



@NgModule({
  declarations: [DepositComponent, ConfirmDepositModalComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    AssetInputModule,
    TransactionSuccessModalModule,
    TransactionProcessingModalModule,
    TransactionLedgerConfirmModalModule,
    ApproveEthContractModule,
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
