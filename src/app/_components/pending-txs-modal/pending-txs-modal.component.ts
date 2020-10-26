import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ExplorerPathsService } from 'src/app/_services/explorer-paths.service';
import { UserService, PendingTransaction } from 'src/app/_services/user.service';

@Component({
  selector: 'app-pending-txs-modal',
  templateUrl: './pending-txs-modal.component.html',
  styleUrls: ['./pending-txs-modal.component.scss']
})
export class PendingTxsModalComponent implements OnInit, OnDestroy {

  completedBncTxs: PendingTransaction[];
  completedBtcTxs: PendingTransaction[];
  pendingBncTxs: PendingTransaction[];
  pendingBtcTxs: PendingTransaction[];
  subs: Subscription[];
  bitcoinExplorerUrl: string;
  binanceExplorerUrl: string;

  constructor(
    private userService: UserService,
    public dialogRef: MatDialogRef<PendingTxsModalComponent>,
    private explorerPathsService: ExplorerPathsService
  ) {

    this.completedBncTxs = [];
    this.completedBtcTxs = [];
    this.pendingBncTxs = [];
    this.pendingBtcTxs = [];

    this.binanceExplorerUrl = this.explorerPathsService.binanceExplorerUrl;
    this.bitcoinExplorerUrl = this.explorerPathsService.bitcoinExplorerUrl;

    const pendingTxs$ = this.userService.pendingTransaction$.subscribe( (txs) => {

      // search for removed BNC transactions and move them to completed
      for (const tx of this.pendingBncTxs) {

        const match = txs.find( (pending) => pending.hash === tx.hash );
        if (!match) {
          this.completedBncTxs.push(tx);
          this.pendingBncTxs = this.pendingBncTxs.filter( (pending) => pending.hash !== tx.hash );
        }

      }

      // search for removed BTC transactions and move them to completed
      for (const tx of this.pendingBtcTxs) {

        const match = txs.find( (pending) => pending.hash === tx.hash );
        if (!match) {
          this.completedBtcTxs.push(tx);
          this.pendingBtcTxs = this.pendingBtcTxs.filter( (pending) => pending.hash !== tx.hash );
        }

      }

      for (const tx of txs) {
        if (tx.chain === 'BNB') {

          const exists = this.pendingBncTxs.includes(tx);
          if (!exists) {
            this.pendingBncTxs.push(tx);
          }

        }

        if (tx.chain === 'BTC') {
          const exists = this.pendingBtcTxs.includes(tx);
          if (!exists) {
            this.pendingBtcTxs.push(tx);
          }

        }
      }

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
