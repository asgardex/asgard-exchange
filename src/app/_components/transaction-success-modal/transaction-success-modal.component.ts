import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ExplorerPathsService } from 'src/app/_services/explorer-paths.service';
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

  constructor(private explorerPathsService: ExplorerPathsService) {
    this.closeDialog = new EventEmitter<null>();
    this.binanceExplorerUrl = `${this.explorerPathsService.binanceExplorerUrl}/tx`;
    this.bitcoinExplorerUrl = `${this.explorerPathsService.bitcoinExplorerUrl}/tx`;
  }

  ngOnInit(): void {
  }

}
