import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionProcessingModalComponent } from './transaction-processing-modal.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [TransactionProcessingModalComponent],
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  exports: [TransactionProcessingModalComponent],
})
export class TransactionProcessingModalModule {}
