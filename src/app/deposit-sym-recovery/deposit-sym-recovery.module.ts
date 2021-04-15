import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DepositSymRecoveryComponent } from './deposit-sym-recovery.component';
import { RouterModule } from '@angular/router';
import { SectionHeadModule } from '../_components/section-head/section-head.module';
import { AssetInputModule } from '../_components/asset-input/asset-input.module';



@NgModule({
  declarations: [DepositSymRecoveryComponent],
  imports: [
    CommonModule,
    SectionHeadModule,
    AssetInputModule,
    RouterModule.forChild([
      {
        path: '',
        component: DepositSymRecoveryComponent
      }
    ])
  ]
})
export class DepositSymRecoveryModule { }
