import { Injectable } from '@angular/core';
import { Chain } from '@xchainjs/xchain-util';
import { BehaviorSubject, of, ReplaySubject, Subject, timer } from 'rxjs';
import { catchError, switchMap, takeUntil, retryWhen, delay, take, retry } from 'rxjs/operators';
import { TransactionDTO } from '../_classes/transaction';
import { User } from '../_classes/user';
import { BinanceService } from './binance.service';
import { MidgardService, ThornodeTx } from './midgard.service';
import { UserService } from './user.service';
import { ethers } from 'ethers';
import { environment } from 'src/environments/environment';
import { SochainService, SochainTxResponse } from './sochain.service';
import { HaskoinService, HaskoinTxResponse } from './haskoin.service';
import { RpcTxSearchRes, ThorchainRpcService } from './thorchain-rpc.service';

export const enum TxStatus {
  PENDING = 'PENDING',
  COMPLETE = 'COMPLETE',
  REFUNDED = 'REFUNDED'
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
  symbol: string;
  hash: string;
  status: TxStatus;
  action: TxActions;
  isThorchainTx: boolean;

  /**
   * This is a temporary patch because midgard is not picking up withdraw of pending assets
   */
  pollThornodeDirectly?: boolean;

  /**
   * This is for THOR.RUNE transfers, which are not picked up by midgard or thornode tx endpoints
   */
  pollRpc?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionStatusService {

  private _txs: Tx[];
  private transactionSource = new BehaviorSubject<Tx[]>([]);
  txs$ = this.transactionSource.asObservable();

  killTxPolling: {[key: string]: Subject<void>} = {};
  user: User;

  ethContractApprovalSource = new ReplaySubject<string>();
  ethContractApproval$ = this.ethContractApprovalSource.asObservable();

  constructor(
    private userService: UserService,
    private midgardService: MidgardService,
    private binanceService: BinanceService,
    private sochainService: SochainService,
    private haskoinService: HaskoinService,
    private rpcService: ThorchainRpcService,
  ) {
    this._txs = [];

    userService.user$.subscribe(
      (user) => this.user = user
    );

  }

  // this needs to be simplified and cleaned up
  // only check against thorchain to see if tx is successful
  // add inputs and outputs to Tx
  addTransaction(pendingTx: Tx) {

    // remove 0x
    if (pendingTx.chain === 'ETH') {
      pendingTx.hash = pendingTx.hash.substr(2);
    }

    this._txs.unshift(pendingTx);

    if (pendingTx.status === TxStatus.PENDING) {

      this.killTxPolling[pendingTx.hash] = new Subject();

      if (pendingTx.isThorchainTx || pendingTx.chain === 'THOR') {

        if (pendingTx.pollRpc) {
          /**
           * THOR.RUNE transfers to different wallet
           */
          this.pollRpc(pendingTx.hash);

        } else if (pendingTx.pollThornodeDirectly) {
          /**
           * This is a temporary patch because midgard is not picking up withdraw of pending assets
           */
           this.pollThornodeTx(pendingTx.hash);

        } else {
          /**
           * Poll Midgard
           */
           this.pollThorchainTx(pendingTx.hash);

        }

      } else {

        if (pendingTx.chain === 'BNB') {
          this.pollBnbTx(pendingTx);
        } else if (pendingTx.chain === 'ETH') {
          this.pollEthTx(pendingTx);
        } else if (pendingTx.chain === 'BTC' || pendingTx.chain === 'LTC') {
          this.pollSochainTx(pendingTx);
        } else if (pendingTx.chain === 'BCH') {
          this.pollBchTx(pendingTx);
        }

      }

    }

    this.transactionSource.next(this._txs);
  }

  clearPendingTransactions() {
    this.transactionSource.next([]);
    this._txs = [];

    for (const hash in this.killTxPolling) {
      if (this.killTxPolling[hash]) {
        this.killTxPolling[hash].next();
      }
    }
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


  async pollEthContractApproval(txHash) {

    if (!this.user) {
      throw new Error('no user found polling eth contract approval');
    }

    this.killTxPolling[txHash] = new Subject();

    const infuraProjectId = environment.infuraProjectId;

    const provider = new ethers.providers.InfuraProvider(
      environment.network === 'testnet' ? 'ropsten' : 'mainnet',
      infuraProjectId
    );
    timer(0, 10000)
      .pipe(
        // This kills the request if the user closes the component
        takeUntil(this.killTxPolling[txHash]),
        // switchMap cancels the last request, if no response have been received since last tick
        switchMap(() => provider.getTransaction(txHash)),
        // catchError handles http throws
        catchError(error => of(error))
      ).subscribe( async (res: ethers.providers.TransactionResponse) => {

        if (res.confirmations > 0) {
          this.ethContractApprovalSource.next(txHash);
          this.killTxPolling[txHash].next();
        }

      });
  }

  pollThorchainTx(hash: string) {
    timer(0, 15000)
    .pipe(
      // This kills the request if the user closes the component
      takeUntil(this.killTxPolling[hash]),
      // switchMap cancels the last request, if no response have been received since last tick
      switchMap(() => this.midgardService.getTransaction(hash)),
      // retry in case CORS error or something fails
      retry(),
    ).subscribe( async (res: TransactionDTO) => {

      if (res.count > 0) {
        for (const resTx of res.actions) {

          if (resTx.in[0].txID.toUpperCase() === hash.toUpperCase() && resTx.status.toUpperCase() === 'SUCCESS') {

            if (resTx.status.toUpperCase() === 'REFUND') {
              this.updateTxStatus(hash, TxStatus.REFUNDED);
            } else {
              this.updateTxStatus(hash, TxStatus.COMPLETE);
            }

            this.userService.fetchBalances();
            this.killTxPolling[hash].next();
          } else {
            console.log('still pending...');
            console.log('resTx.in[0].txID.toUpperCase() is ', resTx.in[0].txID.toUpperCase());
            console.log('tx.hash.toUpperCase() is: ', hash.toUpperCase());
            console.log('resTx.status.toUpperCase() is: ', resTx.status.toUpperCase());
          }
        }
      }

    });
  }

  /**
   * This is being used as a temporary patch
   * Midgard is not picking up WITHDRAW on pending_assets
   */
  pollThornodeTx(hash: string) {
    timer(0, 15000)
    .pipe(
      // This kills the request if the user closes the component
      takeUntil(this.killTxPolling[hash]),
      // switchMap cancels the last request, if no response have been received since last tick
      switchMap(() => this.midgardService.getThornodeTransaction(hash)),
      // catchError handles http throws
      catchError(error => of(error))
    ).subscribe( async (res: ThornodeTx) => {

      if (res && res.observed_tx && res.observed_tx.status && res.observed_tx.status.toUpperCase() === 'DONE') {
        this.updateTxStatus(hash, TxStatus.COMPLETE);
        this.userService.fetchBalances();
        this.killTxPolling[hash].next();
      } else {
        console.log('still pending...');
        console.log('res');
      }

    });
  }

  /**
   * Temporary patch until it's easier to track THOR.RUNE wallet transfers
   */
  pollRpc(hash: string) {
    if (!this.user) {
      return;
    }

    const thorAddress = this.user.clients.thorchain.getAddress();
    if (!thorAddress) {
      return;
    }

    timer(5000, 45000)
    .pipe(
      // This kills the request if the user closes the component
      takeUntil(this.killTxPolling[hash]),
      // switchMap cancels the last request, if no response have been received since last tick
      switchMap(() => this.rpcService.txSearch(thorAddress)),
      retryWhen(errors => errors.pipe(delay(10000), take(10)))
    ).subscribe( async (res: RpcTxSearchRes) => {

      if (res && res.result && res.result.txs && res.result.txs.length > 0) {

        const match = res.result.txs.find( (tx) => tx.hash === hash );
        if (match) {
          this.updateTxStatus(hash, TxStatus.COMPLETE);
          this.userService.fetchBalances();
          this.killTxPolling[hash].next();
        }

      } else {
        console.log('continue polling rpc: ', res);
      }

    });

  }

  pollBchTx(tx: Tx) {

    timer(5000, 15000)
    .pipe(
      // This kills the request if the user closes the component
      takeUntil(this.killTxPolling[tx.hash]),
      // switchMap cancels the last request, if no response have been received since last tick
      switchMap(() => this.haskoinService.getTx(tx.hash)),
      retryWhen(errors => errors.pipe(delay(10000), take(10)))
    ).subscribe( async (res: HaskoinTxResponse) => {

      if (res && res.block && res.block.height && res.block.height > 0) {
        this.updateTxStatus(tx.hash, TxStatus.COMPLETE);
        this.userService.fetchBalances();
        this.killTxPolling[tx.hash].next();
      } else {
        console.log('continue polling bch...', res);
      }

    });
  }

  pollSochainTx(tx: Tx) {
    const network = environment.network === 'testnet' ? 'testnet' : 'mainnet';

    timer(0, 15000)
      .pipe(
        // This kills the request if the user closes the component
        takeUntil(this.killTxPolling[tx.hash]),
        // switchMap cancels the last request, if no response have been received since last tick
        switchMap(() => this.sochainService.getTransaction({txID: tx.hash, network, chain: tx.chain})),
        // sochain returns 404 when not found
        // this allows timer to continue polling
        retryWhen(errors => errors.pipe(delay(10000), take(10)))
      ).subscribe( async (res: SochainTxResponse) => {

        if (res.status === 'success') {
          this.updateTxStatus(tx.hash, TxStatus.COMPLETE);
          this.userService.fetchBalances();
          this.killTxPolling[tx.hash].next();
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

  pollEthTx(tx: Tx) {

    if (this.user && this.user.clients && this.user.clients.ethereum) {

      const ethClient = this.user.clients.ethereum;
      const provider = ethClient.getProvider();

      timer(5000, 15000)
        .pipe(
          // This kills the request if the user closes the component
          takeUntil(this.killTxPolling[tx.hash]),
          // switchMap cancels the last request, if no response have been received since last tick
          switchMap(() => provider.getTransaction(`0x${tx.hash}`)),
          // catchError handles http throws
          catchError(error => of(error))
        ).subscribe( async (res) => {

          if (res.confirmations && res.confirmations > 0) {
            this.updateTxStatus(tx.hash, TxStatus.COMPLETE);
            this.userService.fetchBalances();
            this.killTxPolling[tx.hash].next();
          }

        });

    } else {
      console.error('no eth client found...', this.user);
    }

  }

  chainBlockReward(chain: Chain): number {
    switch (chain) {
      case 'BTC':
        return 6.5;

      case 'BCH':
        return 6.25;

      case 'LTC':
        return 12.5;

      case 'ETH':
        return 3;

      // Confirms immediately
      // case 'BNB':
      //   return ~;

    }
  }

  chainBlockTime(chain: Chain): number {
    // in seconds
    switch (chain) {
      case 'BTC':
        return 600;

      case 'BCH':
        return 600;

      case 'LTC':
        return 150;

      case 'ETH':
        return 15;

      // Confirms immediately
      // case 'BNB':
      //   return ~;
    }
  }

  estimateTime(chain: Chain, amount: number): number {

    if (chain === 'BNB' || chain === 'THOR') {
      return 1;
    } else {
      const chainBlockReward = this.chainBlockReward(chain);
      const chainBlockTime = this.chainBlockTime(chain);
      const estimatedMinutes = (Math.ceil(amount / chainBlockReward) * (chainBlockTime / 60));
      return (estimatedMinutes < 1) ? 1 : estimatedMinutes;
    }

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
