import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MarketListItem } from 'src/app/_components/markets-modal/markets-list-item';
import {
  Client as binanceClient,
  BinanceClient,
  Balance,
  TransferResult, WS
} from '@thorchain/asgardex-binance';
import { User } from 'src/app/_classes/user';
import { MidgardService } from 'src/app/_services/midgard.service';
import { WalletService } from 'src/app/_services/wallet.service';

export interface SwapData {
  sourceAsset: MarketListItem;
  targetAsset: MarketListItem;
  runeFee: number;
  bnbFee: number;
  basePrice: number;
  inputValue: number;
  outputValue: number;
  user: User;
}

enum ConfirmSwapModalState {
  PENDING     = 'PENDING',
  SUBMITTING  = 'SUBMITTING',
  SUCCESS     = 'SUCCESS',
  ERROR       = 'ERROR'
}

@Component({
  selector: 'app-confirm-swap-modal',
  templateUrl: './confirm-swap-modal.component.html',
  styleUrls: ['./confirm-swap-modal.component.scss']
})
export class ConfirmSwapModalComponent implements OnInit {

  confirmationPending: boolean;
  transactionSubmitted: boolean;

  txState: ConfirmSwapModalState;

  user: User;

  constructor(
    @Inject(MAT_DIALOG_DATA) public swapData: SwapData,
    public dialogRef: MatDialogRef<ConfirmSwapModalComponent>,
    private midgardService: MidgardService,
    private walletService: WalletService
  ) {
    this.txState = ConfirmSwapModalState.PENDING;
  }

  ngOnInit(): void {
  }

  closeDialog() {
    this.dialogRef.close();
  }

  submitTransaction() {

    // const validationErrorMsg = validateSwap(wallet, amount);
    // if (validationErrorMsg) {
    //   return reject(new Error(validationErrorMsg));
    // }

    this.midgardService.getProxiedPoolAddresses().subscribe(
      async (res) => {
        console.log('POOL ADDRESSES ARE: ', res);

        const currentPools = res.current;

        if (currentPools && currentPools.length > 0) {

          const matchingPool = currentPools.find( (pool) => pool.chain === 'BNB' );

          if (matchingPool) {

            // const asgardexBncClient: BinanceClient = new binanceClient({
            //   network: 'testnet',
            //   // phrase: '1234'
            // });

            // const bncClient = asgardexBncClient.getBncClient();

            await this.walletService.bncClient.initChain();
            // bncClient.

            // Check of `validateSwap` before makes sure that we have a valid number here
            const amountNumber = this.swapData.inputValue;

            // const limit = protectSlip && slipLimit ? slipLimit.amount().toString() : '';
            const memo = this.getSwapMemo(this.swapData.targetAsset.asset.symbol, this.swapData.user.wallet);

            console.log('user wallet is: ', this.swapData.user.wallet);
            console.log('matching pool address is: ', matchingPool.address);
            console.log('amount number is: ', amountNumber);
            console.log('from symbol is: ', this.swapData.sourceAsset.asset.symbol);
            console.log('memo is: ', memo);

            this.walletService.bncClient
              .transfer(this.swapData.user.wallet, matchingPool.address, amountNumber, this.swapData.sourceAsset.asset.symbol, memo)
              .then((response: TransferResult) => {
                console.log('transfer response is: ', response);
              })
              .catch((error: Error) => {
                console.log('error making transfer: ', error);
              });

          }


        }

      }
    );

  }

  // getPoolAddresses() {
  //   this.midgardService.getProxiedPoolAddresses().subscribe(
  //     (res) => {
  //       console.log('POOL ADDRESSES ARE: ', res);
  //     }
  //   );
  // }

  getSwapMemo(
    symbol: string,
    addr: string,
    sliplimit = '',
  ) {
    return `SWAP:BNB.${symbol}:${addr}:${sliplimit}`;
  }






  // export const confirmSwap = (
  //   bncClient: FixmeType,
  //   wallet: string,
  //   symbolFrom: string,
  //   symbolTo: string,
  //   amount: TokenAmount,
  //   protectSlip: boolean,
  //   slipLimit: BaseAmount,
  //   poolAddress: string,
  //   destAddr = '',
  // ): Promise<TransferResult> => {
  //   return new Promise((resolve, reject) => {
  //     const validationErrorMsg = validateSwap(wallet, amount);
  //     if (validationErrorMsg) {
  //       return reject(new Error(validationErrorMsg));
  //     }

  //     // Check of `validateSwap` before makes sure that we have a valid number here
  //     const amountNumber = amount.amount().toNumber();

  //     const limit = protectSlip && slipLimit ? slipLimit.amount().toString() : '';
  //     const memo = getSwapMemo(symbolTo, destAddr, limit);

  //     bncClient
  //       .transfer(wallet, poolAddress, amountNumber, symbolFrom, memo)
  //       .then((response: TransferResult) => resolve(response))
  //       .catch((error: Error) => reject(error));
  //   });
  // };





}
