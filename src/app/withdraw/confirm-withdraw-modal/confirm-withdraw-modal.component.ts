import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { tokenAmount, tokenToBase } from '@thorchain/asgardex-token';
import { Subject, Subscription } from 'rxjs';
import { PoolAddressDTO } from '../../_classes/pool-address';
import { User } from '../../_classes/user';
import { TransactionConfirmationState } from '../../_const/transaction-confirmation-state';
import { BinanceService } from '../../_services/binance.service';
import { MidgardService } from '../../_services/midgard.service';
import { UserService } from '../../_services/user.service';
import { WalletConnectService } from '../../_services/wallet-connect.service';
import { environment } from 'src/environments/environment';
import { assetAmount, assetToBase } from '@thorchain/asgardex-util';
import { TransactionStatusService, TxStatus } from 'src/app/_services/transaction-status.service';

// TODO: this is the same as ConfirmStakeData in confirm stake modal
export interface ConfirmWithdrawData {
  asset;
  rune;
  assetAmount: number;
  runeAmount: number;
  user: User;
  runeBasePrice: number;
  assetBasePrice: number;
  unstakePercent: number;
}

@Component({
  selector: 'app-confirm-withdraw-modal',
  templateUrl: './confirm-withdraw-modal.component.html',
  styleUrls: ['./confirm-withdraw-modal.component.scss']
})
export class ConfirmWithdrawModalComponent implements OnInit, OnDestroy {

  runeSymbol = environment.network === 'chaosnet' ? 'RUNE-B1A' : 'RUNE-67C';
  txState: TransactionConfirmationState;
  hash: string;
  subs: Subscription[];
  killPolling: Subject<void> = new Subject();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmWithdrawData,
    public dialogRef: MatDialogRef<ConfirmWithdrawModalComponent>,
    private walletConnectService: WalletConnectService,
    private txStatusService: TransactionStatusService,
    private binanceService: BinanceService,
    private midgardService: MidgardService,
    private userService: UserService
  ) {
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;
    const user$ = this.userService.user$.subscribe(
      (user) => {
        if (!user) {
          this.closeDialog();
        }
      }
    );

    this.subs = [user$];
  }

  ngOnInit(): void {
  }

  submitTransaction(): void {
    this.txState = TransactionConfirmationState.SUBMITTING;

    this.midgardService.getProxiedPoolAddresses().subscribe(
      async (res) => {

        const currentPools = res.current;

        if (currentPools && currentPools.length > 0) {

          const matchingPool = currentPools.find( (pool) => pool.chain === this.data.asset.chain );
          const bnbPool = currentPools.find( (pool) => pool.chain === 'BNB' );

          const memo = `WITHDRAW:${this.data.asset.chain}.${this.data.asset.symbol}:${this.data.unstakePercent * 100}`;

          if (bnbPool) {

            if (this.data.user.type === 'keystore' || this.data.user.type === 'ledger') {
              this.keystoreTransaction(bnbPool, memo);
            } else if (this.data.user.type === 'walletconnect') {
              this.walletConnectTransaction(bnbPool, memo);
            }

          }

        }

      }
    );
  }

  async keystoreTransaction(matchingPool: PoolAddressDTO, memo: string) {

    // const bncClient = this.binanceService.bncClient;

    // if (this.data.user.type === 'ledger') {
    //   bncClient.useLedgerSigningDelegate(
    //     this.data.user.ledger,
    //     () => this.txState = TransactionConfirmationState.PENDING_LEDGER_CONFIRMATION,
    //     () => this.txState = TransactionConfirmationState.SUBMITTING,
    //     (err) => console.log('error: ', err),
    //     this.data.user.hdPath
    //   );
    // }

    // await bncClient.initChain();

    const amount = assetToBase(assetAmount(0.00000001));

    // if (this.data.asset.chain === 'BNB') {

    const binanceClient = this.data.user.clients.binance;

    try {
      const hash = await binanceClient.transfer({asset: this.data.rune, amount, recipient: matchingPool.address, memo});
      this.txSuccess(hash);
      this.txStatusService.pollTxOutputs(hash, 2);
      // this.fetchOutputs(hash);
    } catch (error) {
      console.error('error unstaking: ', error);
    }

    // }
    // else if (this.data.asset.chain === 'BTC') {

    //   const bitcoinClient = this.data.user.clients.bitcoin;

    //   try {
    //     const hash = await bitcoinClient.transfer({asset: this.data.asset, amount, recipient: matchingPool.address, memo});
    //     this.txSuccess(hash);
    //   } catch (error) {
    //     console.error('error unstaking: ', error);
    //   }

    // } else {
    //   console.error('no matching chain: ', this.data.asset.chain);
    // }

  }

  // fetchOutputs(hash) {

  //   const refreshInterval$ = timer(0, 15000)
  //   .pipe(
  //     // This kills the request if the user closes the component
  //     takeUntil(this.killPolling),
  //     // switchMap cancels the last request, if no response have been received since last tick
  //     switchMap(() => this.midgardService.getTransaction(hash)),
  //     // catchError handles http throws
  //     catchError(error => of(error))
  //   ).subscribe( (tx) => {

  //     if (tx && tx.txs && tx.txs[0] && tx.txs[0].out && tx.txs[0].out.length >= 2) {

  //       for (const output of tx.txs[0].out) {

  //         this.userService.addPendingTransaction({chain: 'BNB', hash: output.txID});

  //       }

  //       this.killPolling.next();

  //     }

  //   });
  //   this.subs.push(refreshInterval$);

  // }

  walletConnectTransaction(matchingPool: PoolAddressDTO, memo: string) {
    const runeAmount = tokenToBase(tokenAmount(0.00000001))
      .amount()
      .toNumber();

    const coins = [
      {
        denom: this.runeSymbol,
        amount: runeAmount,
      },
    ];

    const sendOrder = this.walletConnectService.walletConnectGetSendOrderMsg({
      fromAddress: this.data.user.wallet,
      toAddress: matchingPool.address,
      coins,
    });

    const bncClient = this.binanceService.bncClient;

    /**
     * TODO: clean up, this is used in confirm-swap-modal as well
     */
    bncClient
      .getAccount(this.data.user.wallet)
      .then(async (response) => {
        if (!response) {
          console.error('error getting response from getAccount');
          return;
        }

        const account = response.result;
        const chainId = environment.network === 'testnet' ? 'Binance-Chain-Nile' : 'Binance-Chain-Tigris';
        const tx = {
          accountNumber: account.account_number.toString(),
          sequence: account.sequence.toString(),
          send_order: sendOrder,
          chainId,
          memo,
        };

        const res = await this.walletConnectService.walletConnectSendTx(tx, bncClient);

        if (res) {
          this.txState = TransactionConfirmationState.SUCCESS;

          if (res.result && res.result.length > 0) {
            this.hash = res.result[0].hash;
            this.txStatusService.addTransaction({
              chain: 'BNB',
              hash: this.hash,
              ticker: `${this.data.asset.ticker}-RUNE`,
              status: TxStatus.PENDING
            });
          }
        }

    })
    .catch((error) => {
      console.error('getAccount error: ', error);
    });

  }

  txSuccess(hash: string) {
    this.txState = TransactionConfirmationState.SUCCESS;
    this.hash = hash;
    this.txStatusService.addTransaction({
      chain: 'BNB',
      hash: this.hash,
      ticker: `${this.data.asset.ticker}-RUNE`,
      status: TxStatus.PENDING
    });
  }

  closeDialog(transactionSucess?: boolean) {
    this.dialogRef.close(transactionSucess);
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
