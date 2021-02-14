import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User } from 'src/app/_classes/user';
import { MidgardService } from 'src/app/_services/midgard.service';
import { UserService } from 'src/app/_services/user.service';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { PoolAddressDTO } from 'src/app/_classes/pool-address';
import { Subscription } from 'rxjs';
import {
  baseAmount,
  assetToBase,
  assetAmount,
} from '@xchainjs/xchain-util';
import { TransactionStatusService, TxActions, TxStatus } from 'src/app/_services/transaction-status.service';
import { SlippageToleranceService } from 'src/app/_services/slippage-tolerance.service';
import BigNumber from 'bignumber.js';
import { TCRopsten } from '../../_abi/thorchain.js';
import { environment } from 'src/environments/environment';
import { thorchainContractAddress } from 'src/app/_const/ropsten-contract-address.js';
import { ethers } from 'ethers';


export interface SwapData {
  sourceAsset;
  targetAsset;
  runeFee: number;
  bnbFee: number;
  basePrice: number;
  inputValue: number;
  outputValue: BigNumber;
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
  error: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public swapData: SwapData,
    public dialogRef: MatDialogRef<ConfirmSwapModalComponent>,
    private midgardService: MidgardService,
    private txStatusService: TransactionStatusService,
    private userService: UserService,
    private slipLimitService: SlippageToleranceService,
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

  ngOnInit() {
    console.log(this.swapData.sourceAsset);

    const asset = this.swapData.sourceAsset;
    if (asset.chain === 'ETH' && asset.symbol !== 'ETH') {
      this.checkApproved();
    }

  }

  async checkApproved() {
    console.log('checking approved');
    const ethClient = this.swapData.user.clients.ethereum;
    const ethAddress = await ethClient.getAddress();
    const amountNumber = this.swapData.inputValue;

    this.midgardService.getInboundAddresses().subscribe(
      async (res) => {

        const ethPool = res.find( (pool) => pool.chain === 'ETH' );
        if (ethPool) {
          const isApproved = ethClient.isApproved(ethPool.router, ethAddress, assetToBase(assetAmount(amountNumber)));
          console.log('is approved: ', isApproved);
        }

      });

  }


  closeDialog(transactionSucess?: boolean) {
    this.dialogRef.close(transactionSucess);
  }

  submitTransaction() {

    this.txState = TransactionConfirmationState.SUBMITTING;

    // Source asset is not RUNE
    if (this.swapData.sourceAsset.chain === 'BNB'
      || this.swapData.sourceAsset.chain === 'BTC'
      || this.swapData.sourceAsset.chain === 'ETH') {

      this.midgardService.getInboundAddresses().subscribe(
        async (res) => {

          const currentPools = res;

          if (currentPools && currentPools.length > 0) {

            console.log('current pools are: ', currentPools);
            console.log('source asset chain is: ', this.swapData.sourceAsset.chain);

            const matchingPool = currentPools.find( (pool) => pool.chain === this.swapData.sourceAsset.chain );
            console.log('matching pool is: ', matchingPool);

            if (matchingPool) {

              if (this.swapData.user.type === 'keystore' || this.swapData.user.type === 'ledger') {
                this.keystoreTransfer(matchingPool);
              } else {
                console.log('no error type matches');
              }

            } else {
              console.log('no matching pool found');
            }

          } else {
            console.log('no current pools found...');
          }

        }
      );

    } else { // RUNE is source asset
      this.keystoreTransfer();
    }

  }

  async keystoreTransfer(matchingPool?: PoolAddressDTO) {

    console.log('matching pool is: ', matchingPool);

    const amountNumber = this.swapData.inputValue;
    const binanceClient = this.swapData.user.clients.binance;
    const bitcoinClient = this.swapData.user.clients.bitcoin;
    const thorClient = this.swapData.user.clients.thorchain;
    const ethClient = this.swapData.user.clients.ethereum;
    const bitcoinAddress = await bitcoinClient.getAddress();
    const binanceAddress = await binanceClient.getAddress();
    const runeAddress = await thorClient.getAddress();
    const ethAddress = await ethClient.getAddress();

    let targetAddress = '';

    switch (this.swapData.targetAsset.chain) {
      case 'BTC':
        targetAddress = bitcoinAddress;
        break;

      case 'BNB':
        targetAddress = binanceAddress;
        break;

      case 'THOR':
        targetAddress = runeAddress;
        break;

      case 'ETH':
        targetAddress = ethAddress;
    }

    const floor = this.slipLimitService.getSlipLimitFromAmount(this.swapData.outputValue);

    const memo = this.getSwapMemo(
      this.swapData.targetAsset.chain,
      this.swapData.targetAsset.symbol,
      targetAddress,
      Math.floor(floor.toNumber())
    );

    if (this.swapData.sourceAsset.chain === 'THOR') {

      try {
        const hash = await thorClient.deposit({
          amount: assetToBase(assetAmount(amountNumber)),
          memo
        });

        this.hash = hash;
        this.txStatusService.addTransaction({
          chain: 'THOR',
          hash: this.hash,
          ticker: this.swapData.sourceAsset.ticker,
          status: TxStatus.PENDING,
          action: TxActions.SWAP
        });
        this.txStatusService.pollTxOutputs(hash, 1, TxActions.SWAP);
        this.txState = TransactionConfirmationState.SUCCESS;
      } catch (error) {
        console.error('error making transfer: ', error);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
      }

    } else if (this.swapData.sourceAsset.chain === 'BNB') {

      try {
        const hash = await binanceClient.transfer({
          asset: this.swapData.sourceAsset,
          amount: assetToBase(assetAmount(amountNumber)),
          recipient: matchingPool.address,
          memo
        });

        this.hash = hash;
        this.txStatusService.addTransaction({
          chain: 'BNB',
          hash: this.hash,
          ticker: this.swapData.sourceAsset.ticker,
          status: TxStatus.PENDING,
          action: TxActions.SWAP
        });
        this.txStatusService.pollTxOutputs(hash, 1, TxActions.SWAP);
        this.txState = TransactionConfirmationState.SUCCESS;
      } catch (error) {
        console.error('error making transfer: ', error);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
      }

    } else if (this.swapData.sourceAsset.chain === 'BTC') {

      try {

        const fee = await bitcoinClient.getFeesWithMemo(memo);
        const feeRates = await bitcoinClient.getFeeRates();
        const toBase = assetToBase(assetAmount(amountNumber));
        const amount = toBase.amount().minus(fee.average.amount());

        const hash = await bitcoinClient.transfer({
          amount: baseAmount(amount),
          recipient: matchingPool.address,
          memo,
          feeRate: feeRates.average
        });

        this.hash = hash;
        this.txStatusService.addTransaction({
          chain: 'BTC',
          hash: this.hash,
          ticker: 'BTC',
          status: TxStatus.PENDING,
          action: TxActions.SWAP
        });
        this.txStatusService.pollTxOutputs(hash, 1, TxActions.SWAP);
        this.txState = TransactionConfirmationState.SUCCESS;
      } catch (error) {
        console.error('error making transfer: ', error);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
      }

    } else if (this.swapData.sourceAsset.chain === 'ETH') {

      try {

        const sourceAsset = this.swapData.sourceAsset;

        const split = sourceAsset.symbol.split('-');

        const assetAddress = (sourceAsset.ticker !== 'ETH' && split.length > 0)
          ? split[1]
          : '0x0000000000000000000000000000000000000000';

        const abi = (environment.network) === 'testnet'
          ? TCRopsten
          : TCRopsten;






        // const params = [
        //   matchingPool.address, // vault
        //   assetAddress, // asset
        //   assetToBase(assetAmount(amountNumber)).amount().toNumber(), // amount
        //   memo
        // ];
        // const contractRes = await ethClient.call(matchingPool.router, abi, 'deposit', params);
        // console.log('contract res is: ', contractRes);

        let hash;
        const targetAsset = this.swapData.targetAsset;

        // this.swapData.targetAsset.chain,
        // this.swapData.targetAsset.symbol,
        // targetAddress,


        // temporarily drops slip limit until mainnet
        const ethMemo = `=:${targetAsset.chain}.${targetAsset.symbol}:${targetAddress}`;
        console.log('eth memo is: ', ethMemo);


        if (sourceAsset.ticker === 'ETH') {

          const wallet = ethClient.getWallet();
          const contract = new ethers.Contract(matchingPool.router, abi, wallet);
          const contractRes = await contract.deposit(
            `${matchingPool.address}`, // not sure if this is correct...
            '0x0000000000000000000000000000000000000000',
            ethers.utils.parseEther(String(amountNumber)),
            // memo,
            ethMemo,
            {from: ethAddress, value: ethers.utils.parseEther(String(amountNumber))}
          );

          hash = contractRes['hash'] ? contractRes['hash'].substring(2) : '';

          console.log('tx is: ', contractRes);

        } else {

          const params = [
            // sourceAsset.ticker === 'ETH' // deposit amount
            //   ? assetToBase(assetAmount(amountNumber)).amount().toNumber()
            //   : assetToBase(assetAmount(0)).amount().toNumber(),
            matchingPool.address, // vault
            assetAddress, // asset
            assetToBase(assetAmount(amountNumber)), // amount
            memo
          ];

          const contractRes = await ethClient.call(matchingPool.router, abi, 'deposit', params);

          hash = contractRes['hash'] ? contractRes['hash'] : '';

          console.log('contract res is: ', contractRes);
        }

        this.hash = hash;
        this.txStatusService.addTransaction({
          chain: 'ETH',
          hash: this.hash,
          ticker: 'ETH',
          status: TxStatus.PENDING,
          action: TxActions.SWAP
        });
        this.txStatusService.pollTxOutputs(hash, 1, TxActions.SWAP);
        this.txState = TransactionConfirmationState.SUCCESS;
      } catch (error) {
        console.error('error making transfer: ', error);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
      }

    }

  }

  getSwapMemo(chain: string, symbol: string, addr: string, sliplimit: number): string {
    return `=:${chain}.${symbol}:${addr}:${sliplimit}`;
  }

  ngOnDestroy(): void {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
