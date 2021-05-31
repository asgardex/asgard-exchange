import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DepositSymRecoveryComponent } from './deposit-sym-recovery.component';
import { RouterModule } from '@angular/router';
import { SectionHeadModule } from '../_components/section-head/section-head.module';
import { AssetInputModule } from '../_components/asset-input/asset-input.module';
import { MatIconModule } from '@angular/material/icon';
import { IconTickerModule } from '../_components/icon-ticker/icon-ticker.module';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [DepositSymRecoveryComponent],
  imports: [
    CommonModule,
    SectionHeadModule,
    AssetInputModule,
    MatButtonModule,
    MatIconModule,
    IconTickerModule,
    MatProgressSpinnerModule,
    RouterModule.forChild([
      {
        path: '',
        component: DepositSymRecoveryComponent,
      },
      {
        path: ':asset',
        component: DepositSymRecoveryComponent,
      },
    ]),
  ],
})
export class DepositSymRecoveryModule {}
