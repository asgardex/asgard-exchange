import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TransferResult } from '@thorchain/asgardex-binance';
import { tokenAmount, tokenToBase } from '@thorchain/asgardex-token';
import { Subscription } from 'rxjs';
import { PoolAddressDTO } from '../../_classes/pool-address';
import { User } from '../../_classes/user';
import { TransactionConfirmationState } from '../../_const/transaction-confirmation-state';
import { BinanceService } from '../../_services/binance.service';
import { MidgardService } from '../../_services/midgard.service';
import { UserService } from '../../_services/user.service';
import { WalletConnectService } from '../../_services/wallet-connect.service';
import { Asset } from '../../_classes/asset';
import { environment } from 'src/environments/environment';

// TODO: this is the same as ConfirmStakeData in confirm stake modal
export interface ConfirmWithdrawData {
  asset: Asset;
  rune: Asset;
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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmWithdrawData,
    public dialogRef: MatDialogRef<ConfirmWithdrawModalComponent>,
    private walletConnectService: WalletConnectService,
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

          const matchingPool = currentPools.find( (pool) => pool.chain === 'BNB' );
          const memo = `WITHDRAW:${this.data.asset.chain}.${this.data.asset.symbol}:${this.data.unstakePercent * 100}`;

          if (matchingPool) {

            if (this.data.user.type === 'keystore') {
              this.keystoreTransaction(matchingPool, memo);
            } else if (this.data.user.type === 'walletconnect') {
              this.walletConnectTransaction(matchingPool, memo);
            }

          }

        }

      }
    );
  }

  async keystoreTransaction(matchingPool: PoolAddressDTO, memo: string) {

    const bncClient = this.binanceService.bncClient;
    await bncClient.initChain();

    const amount = 0.00000001;
    bncClient
      .transfer(this.data.user.wallet, matchingPool.address, amount, this.runeSymbol, memo)
      .then((response: TransferResult) => {
        this.txSuccess(response);
      })
      // If first tx ^ fails (e.g. there is no RUNE available)
      // another tx w/ same memo will be sent, but by using BNB now
      .catch((unstakeErr1: Error) => {

        console.warn('not enough RUNE: ', unstakeErr1);

        bncClient
          .transfer(this.data.user.wallet, matchingPool.address, amount, 'BNB', memo)
          .then((response: TransferResult) => {
            this.txSuccess(response);
          })
          .catch((unstakeErr2: Error) => {
            console.error('error unstaking: ', unstakeErr2);
          });
      });

  }

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
            this.userService.setPendingTransaction(this.hash);
          }
        }

    })
    .catch((error) => {
      console.error('getAccount error: ', error);
    });

  }

  txSuccess(response: TransferResult) {

    this.txState = TransactionConfirmationState.SUCCESS;

    if (response.result && response.result.length > 0) {
      this.hash = response.result[0].hash;
      this.userService.setPendingTransaction(this.hash);
    }
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
