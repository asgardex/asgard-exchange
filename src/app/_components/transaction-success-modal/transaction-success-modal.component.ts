import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Chain } from '@xchainjs/xchain-util';
import { ExplorerPathsService } from 'src/app/_services/explorer-paths.service';

@Component({
  selector: 'app-transaction-success-modal',
  templateUrl: './transaction-success-modal.component.html',
  styleUrls: ['./transaction-success-modal.component.scss']
})
export class TransactionSuccessModalComponent implements OnInit {

  @Input() chain: Chain;
  @Input() hash: string;
  @Input() label: string;
  @Output() closeDialog: EventEmitter<null>;

  binanceExplorerUrl: string;
  bitcoinExplorerUrl: string;
  ethereumExplorerUrl: string;
  thorchainExplorerUrl: string;

  constructor(private explorerPathsService: ExplorerPathsService) {
    this.closeDialog = new EventEmitter<null>();
    this.binanceExplorerUrl = `${this.explorerPathsService.binanceExplorerUrl}/tx`;
    this.bitcoinExplorerUrl = `${this.explorerPathsService.bitcoinExplorerUrl}/tx`;
    this.ethereumExplorerUrl = `${this.explorerPathsService.ethereumExplorerUrl}/tx`;
    this.thorchainExplorerUrl = `${this.thorchainExplorerUrl}/tx`;
  }

  ngOnInit(): void {
  }

}
