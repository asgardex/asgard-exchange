import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

/** MATERIAL */
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** COMPONENTS */
import { SwapComponent } from './swap.component';
import { ConfirmSwapModalComponent } from './confirm-swap-modal/confirm-swap-modal.component';

/** MODULES */
import { AssetInputModule } from '../_components/asset-input/asset-input.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [SwapComponent, ConfirmSwapModalComponent],
  imports: [
    CommonModule,
    AssetInputModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule.forChild([
      {
        path: '',
        component: SwapComponent
      }
    ])
  ],
  entryComponents: [ConfirmSwapModalComponent]
})
export class SwapModule { }
