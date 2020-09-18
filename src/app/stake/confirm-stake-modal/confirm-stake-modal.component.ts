import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MultiTransfer, TransferResult } from '@thorchain/asgardex-binance';
import { Asset } from 'src/app/_classes/asset';
import { User } from 'src/app/_classes/user';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { MidgardService } from 'src/app/_services/midgard.service';
import { UserService } from 'src/app/_services/user.service';
import { WalletService } from 'src/app/_services/wallet.service';

export interface ConfirmStakeData {
  asset: Asset;
  rune: Asset;
  assetAmount: number;
  runeAmount: number;
  user: User;
  runeBasePrice: number;
  assetBasePrice: number;
}

@Component({
  selector: 'app-confirm-stake-modal',
  templateUrl: './confirm-stake-modal.component.html',
  styleUrls: ['./confirm-stake-modal.component.scss']
})
export class ConfirmStakeModalComponent implements OnInit {

  txState: TransactionConfirmationState;
  hash: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmStakeData,
    public dialogRef: MatDialogRef<ConfirmStakeModalComponent>,
    private walletService: WalletService,
    private midgardService: MidgardService,
    private userService: UserService
  ) {
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;
  }

  ngOnInit(): void {
  }

  submitTransaction(): void {
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
            const amountNumber = this.data.assetAmount;

            // const limit = protectSlip && slipLimit ? slipLimit.amount().toString() : '';
            // const memo = this.getSwapMemo(this.swapData.targetAsset.symbol, this.swapData.user.wallet);

            const memo = `STAKE:BNB.${this.data.asset.symbol}`;

            const outputs: MultiTransfer[] = [
              {
                to: matchingPool.address,
                coins: [
                  {
                    denom: this.data.rune.symbol,
                    amount: this.data.runeAmount,
                  },
                  {
                    denom: this.data.asset.symbol,
                    amount: this.data.assetAmount,
                  },
                ],
              },
            ];

            this.walletService.bncClient
              .multiSend(this.data.user.wallet, outputs, memo)
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




            // this.walletService.bncClient
            //   .transfer(this.data.user.wallet, matchingPool.address, amountNumber, this.swapData.sourceAsset.symbol, memo)
            //   .then((response: TransferResult) => {
            //     console.log('transfer response is: ', response);
            //     this.txState = TransactionConfirmationState.SUCCESS;

            //     if (response.result && response.result.length > 0) {
            //       this.hash = response.result[0].hash;
            //       this.userService.setPendingTransaction(this.hash);
            //     }

            //   })
            //   .catch((error: Error) => {
            //     console.log('error making transfer: ', error);
            //     this.txState = TransactionConfirmationState.ERROR;
            //   });

          }

        }

      }
    );
  }

  closeDialog(transactionSucess?: boolean) {
    this.dialogRef.close(transactionSucess);
  }



}
