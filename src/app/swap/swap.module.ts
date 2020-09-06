import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SwapComponent } from './swap.component';



@NgModule({
  declarations: [SwapComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: SwapComponent
      }
    ])
  ]
})
export class SwapModule { }
