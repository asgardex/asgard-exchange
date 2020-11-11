import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ExplorerPathsService } from 'src/app/_services/explorer-paths.service';
import { TransactionStatusService, Tx } from 'src/app/_services/transaction-status.service';

@Component({
  selector: 'app-pending-txs-modal',
  templateUrl: './pending-txs-modal.component.html',
  styleUrls: ['./pending-txs-modal.component.scss']
})
export class PendingTxsModalComponent implements OnInit, OnDestroy {

  txs: Tx[];
  subs: Subscription[];
  bitcoinExplorerUrl: string;
  binanceExplorerUrl: string;
  @Output() back: EventEmitter<null>;

  constructor(
    public dialogRef: MatDialogRef<PendingTxsModalComponent>,
    private explorerPathsService: ExplorerPathsService,
    private txStatusService: TransactionStatusService
  ) {

    this.back = new EventEmitter<null>();
    this.txs = [];

    this.binanceExplorerUrl = `${this.explorerPathsService.binanceExplorerUrl}/tx`;
    this.bitcoinExplorerUrl = `${this.explorerPathsService.bitcoinExplorerUrl}/tx`;

    const pendingTxs$ = this.txStatusService.txs$.subscribe( (txs) => {
      this.txs = txs;
    });

    this.subs = [pendingTxs$];

  }

  ngOnInit(): void {

  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
