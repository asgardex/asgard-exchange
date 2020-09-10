import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketsModalComponent } from './markets-modal.component';

/**
 * Material
 */
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';


@NgModule({
  declarations: [MarketsModalComponent],
  imports: [
    MatButtonModule,
    MatIconModule,
    CommonModule,
    FormsModule
  ],
  exports: [MarketsModalComponent]
})
export class MarketsModalModule { }
