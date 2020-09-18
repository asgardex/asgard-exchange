import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionSuccessModalComponent } from './transaction-success-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';



@NgModule({
  declarations: [TransactionSuccessModalComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
  ],
  exports: [TransactionSuccessModalComponent]
})
export class TransactionSuccessModalModule { }
