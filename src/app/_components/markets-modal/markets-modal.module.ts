import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketsModalComponent } from './markets-modal.component';
import { AssetsListModule } from '../assets-list/assets-list.module';

/**
 * Material
 */
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [MarketsModalComponent],
  imports: [
    MatButtonModule,
    MatIconModule,
    CommonModule,
    MatProgressSpinnerModule,
    FormsModule,
    AssetsListModule,
  ],
  exports: [MarketsModalComponent],
})
export class MarketsModalModule {}
