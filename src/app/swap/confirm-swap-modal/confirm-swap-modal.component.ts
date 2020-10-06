import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Asset } from 'src/app/_classes/asset';
import { TransferResult } from '@thorchain/asgardex-binance';
import { User } from 'src/app/_classes/user';
import { MidgardService } from 'src/app/_services/midgard.service';
import { UserService } from 'src/app/_services/user.service';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { PoolAddressDTO } from 'src/app/_classes/pool-address';
import { environment } from 'src/environments/environment';
import { tokenAmount, tokenToBase } from '@thorchain/asgardex-token';
import { Subscription } from 'rxjs';
import { BinanceService } from 'src/app/_services/binance.service';
import { WalletConnectService } from 'src/app/_services/wallet-connect.service';

const bech32 = require('bech32');

export interface SwapData {
  sourceAsset: Asset;
  targetAsset: Asset;
  runeFee: number;
  bnbFee: number;
  basePrice: number;
  inputValue: number;
  outputValue: number;
  user: User;
  slip: number;
}

@Component({
  selector: 'app-confirm-swap-modal',
  templateUrl: './confirm-swap-modal.component.html',
  styleUrls: ['./confirm-swap-modal.component.scss']
})
export class ConfirmSwapModalComponent implements OnInit, OnDestroy {

  confirmationPending: boolean;
  transactionSubmitted: boolean;
  txState: TransactionConfirmationState;
  hash: string;
  user: User;
  subs: Subscription[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public swapData: SwapData,
    public dialogRef: MatDialogRef<ConfirmSwapModalComponent>,
    private midgardService: MidgardService,
    private walletConnectService: WalletConnectService,
    private binanceService: BinanceService,
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

  closeDialog(transactionSucess?: boolean) {
    this.dialogRef.close(transactionSucess);
  }

  submitTransaction() {

    this.txState = TransactionConfirmationState.SUBMITTING;

    this.midgardService.getProxiedPoolAddresses().subscribe(
      async (res) => {

        const currentPools = res.current;

        if (currentPools && currentPools.length > 0) {

          const matchingPool = currentPools.find( (pool) => pool.chain === 'BNB' );

          if (matchingPool) {

            if (this.swapData.user.type === 'keystore') {
              this.keystoreTransfer(matchingPool);
            } else if (this.swapData.user.type === 'walletconnect') {
              this.walletConnectTransfer(matchingPool);
            }

          }

        }

      }
    );

  }

  async keystoreTransfer(matchingPool: PoolAddressDTO) {

    const bncClient = this.binanceService.bncClient;

    // Check of `validateSwap` before makes sure that we have a valid number here
    const amountNumber = this.swapData.inputValue;

    // const limit = protectSlip && slipLimit ? slipLimit.amount().toString() : '';
    const memo = this.getSwapMemo(this.swapData.targetAsset.symbol, this.swapData.user.wallet);

    bncClient
      .transfer(this.swapData.user.wallet, matchingPool.address, amountNumber, this.swapData.sourceAsset.symbol, memo)
      .then((response: TransferResult) => {
        console.log('transfer response is: ', response);
        this.txState = TransactionConfirmationState.SUCCESS;

        if (response.result && response.result.length > 0) {
          this.hash = response.result[0].hash;
          this.userService.setPendingTransaction(this.hash);
        }

      })
      .catch((error: Error) => {
        console.log('error making transfer: ', error);
        this.txState = TransactionConfirmationState.ERROR;
      });
  }

  walletConnectTransfer(matchingPool: PoolAddressDTO) {

    const coins = [{
      denom: this.swapData.sourceAsset.symbol,
      amount: tokenToBase(tokenAmount(this.swapData.inputValue))
        .amount()
        .toNumber(),
    }];
    const sendOrder = this.walletConnectService.walletConnectGetSendOrderMsg({
      fromAddress: this.swapData.user.wallet,
      toAddress: matchingPool.address,
      coins,
    });
    const memo = this.getSwapMemo(this.swapData.targetAsset.symbol, this.swapData.user.wallet);

    const bncClient = this.binanceService.bncClient;

    bncClient
      .getAccount(this.swapData.user.wallet)
      .then( async (response) => {

        if (!response) {
          console.error('no response getting account:', response);
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

  getSwapMemo(
    symbol: string,
    addr: string,
    sliplimit = '',
  ) {
    return `SWAP:BNB.${symbol}:${addr}:${sliplimit}`;
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
