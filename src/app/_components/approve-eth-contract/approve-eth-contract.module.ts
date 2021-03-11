import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApproveEthContractComponent } from './approve-eth-contract.component';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApproveEthContractModalComponent } from './approve-eth-contract-modal/approve-eth-contract-modal.component';
import { MatIconModule } from '@angular/material/icon';



@NgModule({
  declarations: [ApproveEthContractComponent, ApproveEthContractModalComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  exports: [ApproveEthContractComponent]
})
export class ApproveEthContractModule { }
