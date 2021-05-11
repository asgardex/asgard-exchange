import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-transaction-processing-modal',
  templateUrl: './transaction-processing-modal.component.html',
  styleUrls: ['./transaction-processing-modal.component.scss'],
})
export class TransactionProcessingModalComponent {
  @Input() transactionDetail: string;
  @Output() closeDialog: EventEmitter<null>;

  constructor() {
    this.closeDialog = new EventEmitter<null>();
  }

  onCloseDialog() {
    this.closeDialog.emit();
  }
}
