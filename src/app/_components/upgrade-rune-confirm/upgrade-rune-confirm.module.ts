import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpgradeRuneConfirmComponent } from './upgrade-rune-confirm.component';
import { MatIconModule } from '@angular/material/icon';
import { TransactionProcessingModalModule } from '../transaction-processing-modal/transaction-processing-modal.module';
import { MatButtonModule } from '@angular/material/button';
import { DirectivesModule } from 'src/app/_directives/directives.module';



@NgModule({
  declarations: [UpgradeRuneConfirmComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    TransactionProcessingModalModule,
    DirectivesModule
  ],
  exports: [UpgradeRuneConfirmComponent]
})
export class UpgradeRuneConfirmModule { }
