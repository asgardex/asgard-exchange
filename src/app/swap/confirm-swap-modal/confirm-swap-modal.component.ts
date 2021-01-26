import { Component, OnInit, Inject, OnDestroy, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
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
import { assetAmount, assetToBase, baseAmount } from '@thorchain/asgardex-util';
import { TransactionStatusService, TxActions, TxStatus } from 'src/app/_services/transaction-status.service';
import { SlippageToleranceService } from 'src/app/_services/slippage-tolerance.service';


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
  balance: number;
  sourceAssetPrice: number;
  targetAssetPrice: number;
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

  @Input() swapData: SwapData;

  @Input() overlay: boolean;
  @Output() overlayChange = new EventEmitter<boolean>();

  constructor(
    // @Inject(MAT_DIALOG_DATA) public swapData: SwapData,
    // public dialogRef: MatDialogRef<ConfirmSwapModalComponent>,
    private midgardService: MidgardService,
    private walletConnectService: WalletConnectService,
    private txStatusService: TransactionStatusService,
    private binanceService: BinanceService,
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

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['swapData']) {
      console.log(this.swapData);
    }
  }

  closeDialog(transactionSucess?: boolean) {
    this.overlayChange.emit(!this.overlay);
    // this.dialogRef.close(transactionSucess);
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

    const amountNumber = this.swapData.inputValue;
    const binanceClient = this.swapData.user.clients.binance;
    const bitcoinClient = this.swapData.user.clients.bitcoin;
    const bitcoinAddress = await bitcoinClient.getAddress();
    const binanceAddress = await binanceClient.getAddress();
    const targetAddress = (this.swapData.targetAsset.chain === 'BTC')
      ? bitcoinAddress
      : binanceAddress;
    const floor = this.slipLimitService.getSlipLimitFromAmount(this.swapData.outputValue);

    const memo = this.getSwapMemo(
      this.swapData.targetAsset.chain,
      this.swapData.targetAsset.symbol,
      targetAddress,
      Math.floor(floor.toNumber())
    );

    if (this.swapData.sourceAsset.chain === 'BNB') {

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
        this.txState = TransactionConfirmationState.ERROR;
      }

    } else if (this.swapData.sourceAsset.chain === 'BTC') {

      try {

        console.log('matching pool address is: ', matchingPool.address);

        const fee = await bitcoinClient.getFeesWithMemo(memo);
        const feeRates = await bitcoinClient.getFeeRates();
        const toBase = assetToBase(assetAmount(amountNumber));
        const amount = toBase.amount().minus(fee.average.amount());
        console.log('fee is: ', fee.average.amount().toNumber());

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

    }

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

    const floor = this.slipLimitService.getSlipLimitFromAmount(this.swapData.outputValue);

    const memo = this.getSwapMemo(
      this.swapData.targetAsset.chain,
      this.swapData.targetAsset.symbol,
      this.swapData.user.wallet,
      Math.floor(floor.toNumber())
    );

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
            this.txStatusService.addTransaction({
              chain: 'BNB',
              hash: this.hash,
              ticker: this.swapData.targetAsset.ticker,
              status: TxStatus.PENDING,
              action: TxActions.SWAP
            });
          }
        }


      })
      .catch((error) => {
        console.error('getAccount error: ', error);
      });

  }

  getSwapMemo(chain: string, symbol: string, addr: string, sliplimit: number) {
    return `SWAP:${chain}.${symbol}:${addr}:${sliplimit}`;
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
