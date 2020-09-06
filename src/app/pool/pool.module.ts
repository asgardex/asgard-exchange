import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoolComponent } from './pool.component';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [PoolComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: PoolComponent
      }
    ])
  ]
})
export class PoolModule { }
