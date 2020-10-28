import { Injectable } from '@angular/core';
import { assetFromString } from '@thorchain/asgardex-util';
import { BehaviorSubject, of, Subject, timer } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { TransactionDTO } from '../_classes/transaction';
import { BlockchairBtcTransactionDTO, BlockchairService } from './blockchair.service';
import { MidgardService } from './midgard.service';
import { UserService } from './user.service';

export const enum TxStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE'
}

export interface Tx {
  chain: 'BTC' | 'BNB';
  ticker: string;
  hash: string;
  status: TxStatus;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionStatusService {

  private _txs: Tx[];
  private transactionSource = new BehaviorSubject<Tx[]>([]);
  txs$ = this.transactionSource.asObservable();

  killOutputsPolling: {[key: string]: Subject<void>} = {};

  killTxPolling: {[key: string]: Subject<void>} = {};

  constructor(private blockchairService: BlockchairService, private userService: UserService, private midgardService: MidgardService) {
    this._txs = [];
  }

  addTransaction(pendingTx: Tx) {
    this._txs.push(pendingTx);

    if (pendingTx.status === TxStatus.PENDING) {

      this.killTxPolling[pendingTx.hash] = new Subject();

      if (pendingTx.chain === 'BNB') {
        this.pollBnbTx(pendingTx);
      } else if (pendingTx.chain === 'BTC') {
        this.pollBtcTx(pendingTx);
      }

    }

    this.transactionSource.next(this._txs);
  }

  updateTxStatus(hash: string, status: TxStatus) {

    const updatedTxs = this._txs.reduce( (txs, tx) => {

      if (tx.hash === hash) {
        tx.status = status;
      }

      txs.push(tx);

      return txs;

    }, []);

    this._txs = updatedTxs;
    this.transactionSource.next(this._txs);

  }

  pollTxOutputs(hash: string, outputLength: number) {

    this.killOutputsPolling[hash] = new Subject();

    const refreshInterval$ = timer(0, 15000)
    .pipe(
      // This kills the request if the user closes the component
      takeUntil(this.killOutputsPolling[hash]),
      // switchMap cancels the last request, if no response have been received since last tick
      switchMap(() => this.midgardService.getTransaction(hash)),
      // catchError handles http throws
      catchError(error => of(error))
    ).subscribe( (tx: TransactionDTO) => {

      console.log('tx res is: ', tx);

      if (tx && tx.txs && tx.txs[0] && tx.txs[0].out && tx.txs[0].out.length >= outputLength) {

        for (const output of tx.txs[0].out) {

          const asset = assetFromString(output.coins[0].asset);

          this.addTransaction({chain: 'BNB', hash: output.txID, ticker: asset.ticker, status: TxStatus.PENDING});
        }

        this.killOutputsPolling[hash].next();

      }

    });
    // this.subs.push(refreshInterval$);

  }

  pollBtcTx(tx: Tx) {
    const refreshInterval$ = timer(0, 5000)
    .pipe(
      // This kills the request if the user closes the component
      takeUntil(this.killTxPolling[tx.hash]),
      // switchMap cancels the last request, if no response have been received since last tick
      switchMap(() => this.blockchairService.getBitcoinTransaction(tx.hash)),
      // catchError handles http throws
      catchError(error => of(error))
    ).subscribe( async (res: BlockchairBtcTransactionDTO) => {


      if (res && res.data && res.data[tx.hash] && res.data[tx.hash].transaction
        && res.data[tx.hash].transaction.block_id && res.data[tx.hash].transaction.block_id > 0) {
          this.updateTxStatus(tx.hash, TxStatus.COMPLETE);
          this.userService.fetchBalances();
          this.killTxPolling[tx.hash].next();
      }

    });
    // this.subs.push(refreshInterval$);
  }

  pollBnbTx(tx: Tx) {

    const refreshInterval$ = timer(0, 5000)
    .pipe(
      // This kills the request if the user closes the component
      takeUntil(this.killTxPolling[tx.hash]),
      // switchMap cancels the last request, if no response have been received since last tick
      switchMap(() => this.midgardService.getTransaction(tx.hash)),
      // catchError handles http throws
      catchError(error => of(error))
    ).subscribe( async (res: TransactionDTO) => {

      if (res && res.txs && res.txs.length > 0) {

        if (res.txs[0].status === 'Success') {
          this.updateTxStatus(tx.hash, TxStatus.COMPLETE);
          this.userService.fetchBalances();
          this.killTxPolling[tx.hash].next();

          // this.pendingTxs = this.pendingTxs.filter( (pending) => pending !== tx );

        }

      }

    });
    // this.subs.push(refreshInterval$);
  }

  getPendingTxCount() {
    return this._txs.reduce( (count, tx) => {

      if (tx.status === TxStatus.PENDING) {
        count++;
      }

      return count;

    }, 0);
  }

  // removePendingTransaction(completedTx: PendingTransaction) {
  //   const filtered = this._pendingTxs.filter( (tx) => tx.hash !== completedTx.hash );
  //   this._pendingTxs = filtered;
  //   this.pendingTransactionSource.next(filtered);
  // }

}
