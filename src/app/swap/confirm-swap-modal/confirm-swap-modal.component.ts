import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User } from 'src/app/_classes/user';
import { MidgardService } from 'src/app/_services/midgard.service';
import { UserService } from 'src/app/_services/user.service';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { PoolAddressDTO } from 'src/app/_classes/pool-address';
import { Subscription } from 'rxjs';
import { TransactionStatusService, TxActions, TxStatus } from 'src/app/_services/transaction-status.service';
import { SlippageToleranceService } from 'src/app/_services/slippage-tolerance.service';
import BigNumber from 'bignumber.js';
import { ETH_DECIMAL } from '@xchainjs/xchain-ethereum/lib';
import { EthUtilsService } from 'src/app/_services/eth-utils.service';
import {
  baseAmount,
  assetToBase,
  assetAmount,
  Asset,
  assetToString,
} from '@xchainjs/xchain-util';
import { Balances } from '@xchainjs/xchain-client';


export interface SwapData {
  sourceAsset;
  targetAsset;
  outboundTransactionFee: number;
  bnbFee: number;
  basePrice: number;
  inputValue: number;
  outputValue: BigNumber;
  user: User;
  slip: number;
  estimatedFee: number;
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
  ethNetworkFee: number;
  insufficientChainBalance: boolean;
  loading: boolean;
  estimatedMinutes: number;
  balances: Balances;

  constructor(
    @Inject(MAT_DIALOG_DATA) public swapData: SwapData,
    public dialogRef: MatDialogRef<ConfirmSwapModalComponent>,
    private midgardService: MidgardService,
    private txStatusService: TransactionStatusService,
    private userService: UserService,
    private slipLimitService: SlippageToleranceService,
    private ethUtilsService: EthUtilsService
  ) {
    this.loading = true;
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;
    this.insufficientChainBalance = false;

    const user$ = this.userService.user$.subscribe(
      (user) => {
        if (!user) {
          this.closeDialog();
        }
      }
    );

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => this.balances = balances
    );

    this.subs = [user$, balances$];

  }

  ngOnInit() {

    this.estimateTime();

    const sourceAsset = this.swapData.sourceAsset;
    if (sourceAsset.chain === 'ETH') {

      // ESTIMATE GAS HERE
      this.estimateEthGasPrice();

    } else {
      this.loading = false;
    }

  }

  async estimateTime() {
    if (this.swapData.sourceAsset.chain === 'ETH' && this.swapData.sourceAsset.symbol !== 'ETH') {
      this.estimatedMinutes = await this.ethUtilsService.estimateERC20Time(
        assetToString(this.swapData.sourceAsset),
        this.swapData.inputValue
      );
    } else {
      this.estimatedMinutes = this.txStatusService.estimateTime(this.swapData.sourceAsset.chain, this.swapData.inputValue);
    }
  }

  closeDialog(transactionSucess?: boolean) {
    this.dialogRef.close(transactionSucess);
  }

  submitTransaction() {

    this.txState = TransactionConfirmationState.SUBMITTING;

    // Source asset is not RUNE
    if (this.swapData.sourceAsset.chain === 'BNB'
      || this.swapData.sourceAsset.chain === 'BTC'
      || this.swapData.sourceAsset.chain === 'ETH'
      || this.swapData.sourceAsset.chain === 'LTC'
      || this.swapData.sourceAsset.chain === 'BCH') {

      this.midgardService.getInboundAddresses().subscribe(
        async (res) => {

          const currentPools = res;

          if (currentPools && currentPools.length > 0) {

            const matchingPool = currentPools.find( (pool) => pool.chain === this.swapData.sourceAsset.chain );

            if (matchingPool) {

              if (
                this.swapData.user.type === 'keystore' ||
                this.swapData.user.type === 'ledger' ||
                this.swapData.user.type === 'XDEFI'
              ) {
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

    const amountNumber = this.swapData.inputValue;
    const binanceClient = this.swapData.user.clients.binance;
    const bitcoinClient = this.swapData.user.clients.bitcoin;
    const thorClient = this.swapData.user.clients.thorchain;
    const ethClient = this.swapData.user.clients.ethereum;
    const litecoinClient = this.swapData.user.clients.litecoin;

    const targetAddress = await this.userService.getTokenAddress(this.swapData.user, this.swapData.targetAsset.chain);

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
          action: TxActions.SWAP,
          isThorchainTx: true,
          symbol: this.swapData.sourceAsset.symbol,
        });
        this.txState = TransactionConfirmationState.SUCCESS;
      } catch (error) {
        console.error('error making transfer: ', error);
        console.error(error.stack);
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
        this.pushTxStatus(hash, this.swapData.sourceAsset);
        this.txState = TransactionConfirmationState.SUCCESS;
      } catch (error) {
        console.error('error making transfer: ', error);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
      }

    } else if (this.swapData.sourceAsset.chain === 'BTC') {

      try {

        // TODO -> consolidate this with BTC, BCH, LTC
        const balanceAmount = this.userService.findRawBalance(this.balances, this.swapData.sourceAsset);
        const toBase = assetToBase(assetAmount(amountNumber));
        const feeToBase = assetToBase(assetAmount(this.swapData.estimatedFee));
        if (balanceAmount.minus(feeToBase.amount()).minus(toBase.amount()).isGreaterThan(0)) {

        }
        const amount = (balanceAmount
          // subtract fee
          .minus(feeToBase.amount())
          // subtract amount
          .minus(toBase.amount())
          .isGreaterThan(0))
            ? toBase.amount() // send full amount, fee can be deducted from remaining balance
            : toBase.amount().minus(feeToBase.amount()); // after deductions, not enough to process, subtract fee from amount

        if (amount.isLessThan(0)) {
          this.error = 'Insufficient funds. Try sending a smaller amount';
          this.txState = TransactionConfirmationState.ERROR;
          return;
        }
        // TODO -> consolidate this with BTC, BCH, LTC


        const hash = await bitcoinClient.transfer({
          amount: baseAmount(amount),
          recipient: matchingPool.address,
          memo,
          feeRate: +matchingPool.gas_rate
        });

        this.hash = hash;
        this.pushTxStatus(hash, this.swapData.sourceAsset);
        this.txState = TransactionConfirmationState.SUCCESS;
      } catch (error) {
        console.error('error making transfer: ', error);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
      }

    } else if (this.swapData.sourceAsset.chain === 'ETH') {

      try {

        const sourceAsset = this.swapData.sourceAsset;
        const targetAsset = this.swapData.targetAsset;

        // temporarily drops slip limit until mainnet
        const ethMemo = `=:${targetAsset.chain}.${targetAsset.symbol}:${targetAddress}`;

        const decimal = await this.ethUtilsService.getAssetDecimal(this.swapData.sourceAsset, ethClient);
        let amount = assetToBase(assetAmount(this.swapData.inputValue, decimal)).amount();
        const balanceAmount = this.userService.findRawBalance(this.balances, this.swapData.sourceAsset);

        if (amount.isGreaterThan(balanceAmount)) {
          amount = balanceAmount;
        }

        const hash = await this.ethUtilsService.callDeposit({
          inboundAddress: matchingPool,
          asset: sourceAsset,
          memo: ethMemo,
          amount,
          ethClient
        });

        this.hash = hash.substr(2);
        this.pushTxStatus(hash, this.swapData.sourceAsset);
        this.txState = TransactionConfirmationState.SUCCESS;
      } catch (error) {
        console.error('error making transfer: ', error);
        console.error(error.stack);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
      }

    } else if (this.swapData.sourceAsset.chain === 'LTC') {

      try {

        // TODO -> consolidate this with BTC, BCH, LTC
        const balanceAmount = this.userService.findRawBalance(this.balances, this.swapData.sourceAsset);
        const toBase = assetToBase(assetAmount(amountNumber));
        const feeToBase = assetToBase(assetAmount(this.swapData.estimatedFee));
        const amount = (balanceAmount
          // subtract fee
          .minus(feeToBase.amount())
          // subtract amount
          .minus(toBase.amount())
          .isGreaterThan(0))
            ? toBase.amount() // send full amount, fee can be deducted from remaining balance
            : toBase.amount().minus(feeToBase.amount()); // after deductions, not enough to process, subtract fee from amount

        if (amount.isLessThan(0)) {
          this.error = 'Insufficient funds. Try sending a smaller amount';
          this.txState = TransactionConfirmationState.ERROR;
          return;
        }
        // TODO -> consolidate this with BTC, BCH, LTC

        const hash = await litecoinClient.transfer({
          amount: baseAmount(amount),
          recipient: matchingPool.address,
          memo,
          feeRate: +matchingPool.gas_rate
        });

        this.hash = hash;
        this.pushTxStatus(hash, this.swapData.sourceAsset);
        this.txState = TransactionConfirmationState.SUCCESS;
      } catch (error) {
        console.error('error making transfer: ', error);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
      }

    } else if (this.swapData.sourceAsset.chain === 'BCH') {

      try {
        const bchClient = this.swapData.user.clients.bitcoinCash;

        // TODO -> consolidate this with BTC, BCH, LTC
        const balanceAmount = this.userService.findRawBalance(this.balances, this.swapData.sourceAsset);
        const toBase = assetToBase(assetAmount(amountNumber));
        const feeToBase = assetToBase(assetAmount(this.swapData.estimatedFee));
        const amount = (balanceAmount
          // subtract fee
          .minus(feeToBase.amount())
          // subtract amount
          .minus(toBase.amount())
          .isGreaterThan(0))
            ? toBase.amount() // send full amount, fee can be deducted from remaining balance
            : toBase.amount().minus(feeToBase.amount()); // after deductions, not enough to process, subtract fee from amount

        if (amount.isLessThan(0)) {
          this.error = 'Insufficient funds. Try sending a smaller amount';
          this.txState = TransactionConfirmationState.ERROR;
          return;
        }
        // end TODO

        const hash = await bchClient.transfer({
          amount: baseAmount(amount),
          recipient: matchingPool.address,
          memo,
          feeRate: +matchingPool.gas_rate
        });

        this.hash = hash;
        this.pushTxStatus(hash, this.swapData.sourceAsset);
        this.txState = TransactionConfirmationState.SUCCESS;
      } catch (error) {
        console.error('error making transfer: ', error);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
      }

    }

  }

  pushTxStatus(hash: string, asset: Asset) {
    this.txStatusService.addTransaction({
      chain: asset.chain,
      ticker: asset.ticker,
      status: TxStatus.PENDING,
      action: TxActions.SWAP,
      isThorchainTx: true,
      symbol: asset.symbol,
      hash,
    });
  }

  async estimateEthGasPrice() {

    const user = this.swapData.user;
    const sourceAsset = this.swapData.sourceAsset;
    const targetAsset = this.swapData.targetAsset;

    if (user && user.clients && user.clients.ethereum) {

      const ethClient = user.clients.ethereum;
      const targetAddress = await ethClient.getAddress();
      const ethBalances = await ethClient.getBalance();
      const ethBalance = ethBalances[0];

      // get inbound addresses
      this.midgardService.getInboundAddresses().subscribe(
        async (addresses) => {

          const ethInbound = addresses.find( (inbound) => inbound.chain === 'ETH' );

          const decimal = await this.ethUtilsService.getAssetDecimal(this.swapData.sourceAsset, ethClient);
          let amount = assetToBase(assetAmount(this.swapData.inputValue, decimal)).amount();

          const balanceAmount = this.userService.findRawBalance(this.balances, this.swapData.sourceAsset);
          // const balanceAmount = assetToBase(assetAmount(this.swapData.sourceAsset.balance.amount(), decimal)).amount();

          if (amount.isGreaterThan(balanceAmount)) {
            amount = balanceAmount;
          }

          const estimatedFeeWei = await this.ethUtilsService.estimateFee({
            sourceAsset,
            ethClient,
            ethInbound,
            inputAmount: amount,
            memo: `=:${targetAsset.chain}.${targetAsset.symbol}:${targetAddress}`
          });

          this.ethNetworkFee = estimatedFeeWei.dividedBy(10 ** ETH_DECIMAL).toNumber();

          this.insufficientChainBalance = estimatedFeeWei.isGreaterThan(ethBalance.amount.amount());

          this.loading = false;

        }
      );

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
