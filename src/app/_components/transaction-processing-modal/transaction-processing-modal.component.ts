import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-transaction-processing-modal',
  templateUrl: './transaction-processing-modal.component.html',
  styleUrls: ['./transaction-processing-modal.component.scss']
})
export class TransactionProcessingModalComponent implements OnInit {

  @Input() transactionDetail: string;
  @Output() closeDialog: EventEmitter<null>;

  constructor() {
    this.closeDialog = new EventEmitter<null>();
  }

  ngOnInit(): void {
  }

  onCloseDialog() {
    this.closeDialog.emit();
  }

}
