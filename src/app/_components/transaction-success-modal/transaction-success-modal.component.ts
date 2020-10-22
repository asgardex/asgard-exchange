import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-transaction-success-modal',
  templateUrl: './transaction-success-modal.component.html',
  styleUrls: ['./transaction-success-modal.component.scss']
})
export class TransactionSuccessModalComponent implements OnInit {

  @Input() chain: 'BTC' | 'BNB';
  @Input() hash: string;
  @Input() label: string;
  @Output() closeDialog: EventEmitter<null>;

  binanceExplorerUrl: string;
  bitcoinExplorerUrl: string;

  constructor() {
    this.closeDialog = new EventEmitter<null>();

    this.binanceExplorerUrl = environment.network === 'testnet' ? 'https://testnet-explorer.binance.org/tx' : 'https://explorer.binance.org/tx';
    this.bitcoinExplorerUrl = environment.network === 'testnet'
      ? 'https://www.blockchain.com/btc-testnet/tx'
      : 'https://www.blockchain.com/btc/tx';

  }

  ngOnInit(): void {
  }

}
