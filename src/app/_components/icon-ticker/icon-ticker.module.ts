import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconTickerComponent } from './icon-ticker.component';
import { MatIconModule } from '@angular/material/icon';



@NgModule({
  declarations: [IconTickerComponent],
  imports: [
    CommonModule,
    MatIconModule
  ],
  exports: [IconTickerComponent]
})
export class IconTickerModule { }
