import { Injectable } from '@angular/core';
import { assetFromString, Chain } from '@xchainjs/xchain-util';
import { BehaviorSubject, of, Subject, timer } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { TransactionDTO } from '../_classes/transaction';
import { BinanceService } from './binance.service';
import { BlockchairBtcTransactionDTO, BlockchairService } from './blockchair.service';
import { MidgardService } from './midgard.service';
import { UserService } from './user.service';

export const enum TxStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE'
}

export enum TxActions {
  SWAP            = 'Swap',
  DEPOSIT         = 'Deposit',
  WITHDRAW        = 'Withdraw',
  SEND            = 'Send',
  REFUND          = 'Refund',
  UPGRADE_RUNE    = 'Upgrade'
}

export interface Tx {
  chain: Chain;
  ticker: string;
  hash: string;
  status: TxStatus;
  action: TxActions;
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

  constructor(
    private blockchairService: BlockchairService,
    private userService: UserService,
    private midgardService: MidgardService,
    private binanceService: BinanceService
  ) {
    this._txs = [];
  }

  // this needs to be simplified and cleaned up
  // only check against thorchain to see if tx is successful
  // add inputs and outputs to Tx
  addTransaction(pendingTx: Tx) {
    this._txs.unshift(pendingTx);

    if (pendingTx.status === TxStatus.PENDING) {

      this.killTxPolling[pendingTx.hash] = new Subject();

      if (pendingTx.chain === 'BNB') {
        this.pollBnbTx(pendingTx);
      } else if (pendingTx.chain === 'THOR') {
        this.pollThorchainTx(pendingTx);
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

  // to deprecate
  // this needs to be simplified and cleaned up
  pollTxOutputs(hash: string, outputLength: number, action: TxActions) {

    this.killOutputsPolling[hash] = new Subject();

    timer(0, 15000)
      .pipe(
        // This kills the request if the user closes the component
        takeUntil(this.killOutputsPolling[hash]),
        // switchMap cancels the last request, if no response have been received since last tick
        switchMap(() => this.midgardService.getTransaction(hash)),
        // catchError handles http throws
        catchError(error => of(error))
      ).subscribe( (tx: TransactionDTO) => {

        if (tx && tx.actions && tx.actions[0] && tx.actions[0].out && tx.actions[0].status.toUpperCase() === 'SUCCESS') {

          for (const output of tx.actions[0].out) {

            const asset = assetFromString(output.coins[0].asset);

            this.addTransaction({
              chain: asset.chain,
              // hash: output.txID,
              hash,
              ticker: asset.ticker,
              status: TxStatus.COMPLETE,
              action: (tx.actions[0].type.toUpperCase() === 'REFUND') ? TxActions.REFUND : action
            });

            this.killOutputsPolling[hash].next();
          }

        }

        // if (tx && tx.actions && tx.actions[0] && tx.actions[0].out && tx.actions[0].out.length >= outputLength) {

        //   for (const output of tx.actions[0].out) {

        //     const asset = assetFromString(output.coins[0].asset);

        //     this.addTransaction({
        //       chain: asset.chain,
        //       hash: output.txID,
        //       ticker: asset.ticker,
        //       status: TxStatus.PENDING,
        //       action: (tx.actions[0].type.toUpperCase() === 'REFUND') ? TxActions.REFUND : action
        //     });
        //   }

        //   this.killOutputsPolling[hash].next();

        // }

      });
  }

  pollThorchainTx(tx: Tx) {
    timer(0, 15000)
    .pipe(
      // This kills the request if the user closes the component
      takeUntil(this.killTxPolling[tx.hash]),
      // switchMap cancels the last request, if no response have been received since last tick
      switchMap(() => this.midgardService.getTransaction(tx.hash)),
      // catchError handles http throws
      catchError(error => of(error))
    ).subscribe( async (res: TransactionDTO) => {

      console.log('polling tx hash id: ', tx.hash);

      if (res.count > 0) {
        for (const resTx of res.actions) {

          // if (resTx.in[0].txID.toUpperCase() === tx.hash.toUpperCase() ) {

          // }

          if (resTx.in[0].txID.toUpperCase() === tx.hash.toUpperCase() && resTx.status.toUpperCase() === 'SUCCESS') {
            console.log('!! TX is successful !!');
            this.updateTxStatus(tx.hash, TxStatus.COMPLETE);
            this.userService.fetchBalances();
            this.killTxPolling[tx.hash].next();
          } else {
            console.log('still pending...');
            console.log('resTx.in[0].txID.toUpperCase() is ', resTx.in[0].txID.toUpperCase());
            console.log('tx.hash.toUpperCase() is: ', tx.hash.toUpperCase());
            console.log('resTx.status.toUpperCase() is: ', resTx.status.toUpperCase());
          }
        }
      }

    });
  }

  pollBtcTx(tx: Tx) {
    timer(0, 15000)
      .pipe(
        // This kills the request if the user closes the component
        takeUntil(this.killTxPolling[tx.hash]),
        // switchMap cancels the last request, if no response have been received since last tick
        switchMap(() => this.blockchairService.getBitcoinTransaction(tx.hash)),
        // catchError handles http throws
        catchError(error => of(error))
      ).subscribe( async (res: BlockchairBtcTransactionDTO) => {

        for (const key in res.data) {

          if (key.toUpperCase === tx.hash.toUpperCase) {

            if (res && res.data && res.data[key] && res.data[key].transaction
              && res.data[key].transaction.block_id && res.data[key].transaction.block_id > 0) {

                this.updateTxStatus(tx.hash, TxStatus.COMPLETE);
                this.userService.fetchBalances();
                this.killTxPolling[tx.hash].next();
            }

          }

        }

      });
  }

  pollBnbTx(tx: Tx) {

    timer(5000, 15000)
      .pipe(
        // This kills the request if the user closes the component
        takeUntil(this.killTxPolling[tx.hash]),
        // switchMap cancels the last request, if no response have been received since last tick
        // switchMap(() => this.midgardService.getTransaction(tx.hash)),
        switchMap(() => this.binanceService.getTx(tx.hash)),
        // catchError handles http throws
        catchError(error => of(error))
      ).subscribe( async (res) => {

        if (+res.code === 0) {
          this.updateTxStatus(tx.hash, TxStatus.COMPLETE);
          this.userService.fetchBalances();
          this.killTxPolling[tx.hash].next();
        }

      });
  }

  getPendingTxCount() {
    return this._txs.reduce( (count, tx) => {

      if (tx.status === TxStatus.PENDING) {
        count++;
      }

      return count;

    }, 0);
  }

}
