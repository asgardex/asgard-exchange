import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Asset } from 'src/app/_classes/asset';
import { TransferResult } from '@thorchain/asgardex-binance';
import { User } from 'src/app/_classes/user';
import { MidgardService } from 'src/app/_services/midgard.service';
import { WalletService } from 'src/app/_services/wallet.service';
import { UserService } from 'src/app/_services/user.service';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';

export interface SwapData {
  sourceAsset: Asset;
  targetAsset: Asset;
  runeFee: number;
  bnbFee: number;
  basePrice: number;
  inputValue: number;
  outputValue: number;
  user: User;
}

@Component({
  selector: 'app-confirm-swap-modal',
  templateUrl: './confirm-swap-modal.component.html',
  styleUrls: ['./confirm-swap-modal.component.scss']
})
export class ConfirmSwapModalComponent implements OnInit {

  confirmationPending: boolean;
  transactionSubmitted: boolean;

  txState: TransactionConfirmationState;

  hash: string;

  user: User;

  constructor(
    @Inject(MAT_DIALOG_DATA) public swapData: SwapData,
    public dialogRef: MatDialogRef<ConfirmSwapModalComponent>,
    private midgardService: MidgardService,
    private walletService: WalletService,
    private userService: UserService
  ) {
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;
  }

  ngOnInit(): void {
  }

  closeDialog(transactionSucess?: boolean) {
    this.dialogRef.close(transactionSucess);
  }

  submitTransaction() {

    // const validationErrorMsg = validateSwap(wallet, amount);
    // if (validationErrorMsg) {
    //   return reject(new Error(validationErrorMsg));
    // }

    this.txState = TransactionConfirmationState.SUBMITTING;

    this.midgardService.getProxiedPoolAddresses().subscribe(
      async (res) => {
        console.log('POOL ADDRESSES ARE: ', res);

        const currentPools = res.current;

        if (currentPools && currentPools.length > 0) {

          const matchingPool = currentPools.find( (pool) => pool.chain === 'BNB' );

          if (matchingPool) {

            await this.walletService.bncClient.initChain();

            // Check of `validateSwap` before makes sure that we have a valid number here
            const amountNumber = this.swapData.inputValue;

            // const limit = protectSlip && slipLimit ? slipLimit.amount().toString() : '';
            const memo = this.getSwapMemo(this.swapData.targetAsset.symbol, this.swapData.user.wallet);

            console.log('user wallet is: ', this.swapData.user.wallet);
            console.log('matching pool address is: ', matchingPool.address);
            console.log('amount number is: ', amountNumber);
            console.log('from symbol is: ', this.swapData.sourceAsset.symbol);
            console.log('memo is: ', memo);

            this.walletService.bncClient
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

        }

      }
    );

  }

  getSwapMemo(
    symbol: string,
    addr: string,
    sliplimit = '',
  ) {
    return `SWAP:BNB.${symbol}:${addr}:${sliplimit}`;
  }


}
