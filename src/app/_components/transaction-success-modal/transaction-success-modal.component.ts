import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-transaction-success-modal',
  templateUrl: './transaction-success-modal.component.html',
  styleUrls: ['./transaction-success-modal.component.scss']
})
export class TransactionSuccessModalComponent implements OnInit {

  @Input() hash: string;
  @Input() label: string;
  @Output() closeDialog: EventEmitter<null>;

  constructor() {
    this.closeDialog = new EventEmitter<null>();
  }

  ngOnInit(): void {
  }

}
