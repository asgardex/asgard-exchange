import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-transaction-success-modal',
  templateUrl: './transaction-success-modal.component.html',
  styleUrls: ['./transaction-success-modal.component.scss']
})
export class TransactionSuccessModalComponent implements OnInit {

  @Input() hash: string;
  @Input() label: string;
  @Output() closeDialog: EventEmitter<null>;

  binanceExplorerUrl: string;

  constructor() {
    this.closeDialog = new EventEmitter<null>();

    this.binanceExplorerUrl = environment.network === 'testnet' ? 'https://testnet-explorer.binance.org/tx' : 'https://explorer.binance.org/tx';

  }

  ngOnInit(): void {
  }

}
