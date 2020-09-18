import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TransferResult } from '@thorchain/asgardex-binance';
import { Asset } from 'src/app/_classes/asset';
import { User } from 'src/app/_classes/user';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { MidgardService } from 'src/app/_services/midgard.service';
import { UserService } from 'src/app/_services/user.service';
import { WalletService } from 'src/app/_services/wallet.service';
import { environment } from 'src/environments/environment';

// TODO: this is the same as ConfirmStakeData in confirm stake modal
export interface ConfirmUnstakeData {
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
  selector: 'app-confirm-unstake-modal',
  templateUrl: './confirm-unstake-modal.component.html',
  styleUrls: ['./confirm-unstake-modal.component.scss']
})
export class ConfirmUnstakeModalComponent implements OnInit {

  runeSymbol = environment.network === 'chaosnet' ? 'RUNE-B1A' : 'RUNE-67C';

  txState: TransactionConfirmationState;
  hash: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmUnstakeData,
    public dialogRef: MatDialogRef<ConfirmUnstakeModalComponent>,
    private walletService: WalletService,
    private midgardService: MidgardService,
    private userService: UserService
  ) {
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;
    console.log('unstake percent is: ', this.data.unstakePercent);
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

            // const memo = `STAKE:BNB.${this.data.asset.symbol}`;
            const memo = `WITHDRAW:${this.data.asset.chain}.${this.data.asset.symbol}:${this.data.unstakePercent * 100}`;

            const amount = 0.00000001;
            this.walletService.bncClient
              .transfer(this.data.user.wallet, matchingPool.address, amount, this.runeSymbol, memo)
              .then((response: TransferResult) => {
                this.txSuccess(response);
              })
              // If first tx ^ fails (e.g. there is no RUNE available)
              // another tx w/ same memo will be sent, but by using BNB now
              .catch((unstakeErr1: Error) => {

                console.log('not enough RUNE: ', unstakeErr1);

                this.walletService.bncClient
                  .transfer(this.data.user.wallet, matchingPool.address, amount, 'BNB', memo)
                  .then((response: TransferResult) => {
                    this.txSuccess(response);
                  })
                  .catch((unstakeErr2: Error) => {
                    console.error('error unstaking: ', unstakeErr2);
                  });
              });

          }

        }

      }
    );
  }

  txSuccess(response: TransferResult) {
    console.log('transfer response is: ', response);
    this.txState = TransactionConfirmationState.SUCCESS;

    if (response.result && response.result.length > 0) {
      this.hash = response.result[0].hash;
      this.userService.setPendingTransaction(this.hash);
    }
  }

  closeDialog(transactionSucess?: boolean) {
    this.dialogRef.close(transactionSucess);
  }

}
