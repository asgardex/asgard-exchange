import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

/** MATERIAL */
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** COMPONENTS */
import { SwapComponent } from './swap.component';

/** MODULES */
import { AssetInputModule } from '../_components/asset-input/asset-input.module';

@NgModule({
  declarations: [SwapComponent],
  imports: [
    CommonModule,
    AssetInputModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    RouterModule.forChild([
      {
        path: '',
        component: SwapComponent
      }
    ])
  ]
})
export class SwapModule { }
