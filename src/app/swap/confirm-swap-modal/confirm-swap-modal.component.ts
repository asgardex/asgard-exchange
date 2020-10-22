import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
// import { Asset } from 'src/app/_classes/asset';
// import { Asset } from '@xchainjs/xchain-binance';
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
import { baseAmount } from '@thorchain/asgardex-util';

// const bech32 = require('bech32');

export interface SwapData {
  sourceAsset;
  targetAsset;
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

          const matchingPool = currentPools.find( (pool) => pool.chain === this.swapData.sourceAsset.chain );

          console.log('matching pool is: ', matchingPool);

          if (matchingPool) {

            if (this.swapData.user.type === 'keystore' || this.swapData.user.type === 'ledger') {
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

    if (this.swapData.user.type === 'ledger') {
      bncClient.useLedgerSigningDelegate(
        this.swapData.user.ledger,
        () => this.txState = TransactionConfirmationState.PENDING_LEDGER_CONFIRMATION,
        () => this.txState = TransactionConfirmationState.SUBMITTING,
        (err) => console.log('error: ', err),
        this.swapData.user.hdPath
      );
    }

    await bncClient.initChain();

    // Check of `validateSwap` before makes sure that we have a valid number here
    const amountNumber = this.swapData.inputValue;

    // const limit = protectSlip && slipLimit ? slipLimit.amount().toString() : '';
    const binanceClient = this.swapData.user.clients.binance;
    const bitcoinClient = this.swapData.user.clients.bitcoin;

    const bitcoinAddress = await bitcoinClient.getAddress();
    const binanceAddress = await binanceClient.getAddress();
    const targetAddress = (this.swapData.targetAsset.chain === 'BTC')
      ? bitcoinAddress
      : binanceAddress;

    console.log('target address is: ', targetAddress);

    const memo = this.getSwapMemo(this.swapData.targetAsset.chain, this.swapData.targetAsset.symbol, targetAddress);
    console.log('memo is: ', memo);
    console.log('amountNumber is: ', amountNumber);
    console.log('baseamoutn is: ', baseAmount(amountNumber).amount().toNumber());

    if (this.swapData.sourceAsset.chain === 'BNB') {
      const res = await binanceClient.transfer({
        asset: this.swapData.sourceAsset,
        amount: baseAmount(amountNumber),
        recipient: targetAddress,
        memo
      });
      console.log('res is: ', res);
    } else if (this.swapData.sourceAsset.chain === 'BTC') {

    }

    // bncClient
    //   .transfer(binanceAddress, matchingPool.address, amountNumber, this.swapData.sourceAsset.symbol, memo)
    //   .then((response: TransferResult) => {
    //     this.txState = TransactionConfirmationState.SUCCESS;

    //     if (response.result && response.result.length > 0) {
    //       this.hash = response.result[0].hash;
    //       this.userService.setPendingTransaction(this.hash);
    //     }

    //   })
    //   .catch((error: Error) => {
    //     console.error('error making transfer: ', error);
    //     this.txState = TransactionConfirmationState.ERROR;
    //   });
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
    const memo = this.getSwapMemo(this.swapData.targetAsset.chain, this.swapData.targetAsset.symbol, this.swapData.user.wallet);

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

  getSwapMemo(chain: string, symbol: string, addr: string, sliplimit = '') {
    // return `SWAP:${chain}.${symbol}:${addr}:${sliplimit}`;
    return `SWAP:${chain}.${symbol}:${addr}`;
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
