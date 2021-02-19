import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApproveEthContractComponent } from './approve-eth-contract.component';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';



@NgModule({
  declarations: [ApproveEthContractComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  exports: [ApproveEthContractComponent]
})
export class ApproveEthContractModule { }
