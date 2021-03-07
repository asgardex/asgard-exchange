import { Component, OnInit, Inject, OnDestroy, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
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
import { EthUtilsService } from 'src/app/_services/eth-utils.service.js';
import {
  baseAmount,
  assetToBase,
  assetAmount,
} from '@xchainjs/xchain-util';
import { MainViewsEnum, OverlaysService } from 'src/app/_services/overlays.service';
import { number } from 'yargs';
import { ExplorerPathsService } from 'src/app/_services/explorer-paths.service';


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
  ethNetworkFee: number;
  insufficientChainBalance: boolean;
  loading: boolean;
  slippageTolerance: number;

  @Input() swapData: SwapData;

  @Input() overlay: boolean;
  @Output() overlayChange = new EventEmitter<boolean>();

  binanceExplorerUrl: string;
  bitcoinExplorerUrl: string;
  ethereumExplorerUrl: string;
  thorchainExplorerUrl: string;

  constructor(
    // @Inject(MAT_DIALOG_DATA) public swapData: SwapData,
    // public dialogRef: MatDialogRef<ConfirmSwapModalComponent>,
    private midgardService: MidgardService,
    private txStatusService: TransactionStatusService,
    private userService: UserService,
    private slipLimitService: SlippageToleranceService,
    private ethUtilsService: EthUtilsService,
    public overlaysService: OverlaysService,
    private explorerPathsService: ExplorerPathsService
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

    const slippageTolerange$ = this.slipLimitService.slippageTolerance$.subscribe(
      (limit) => this.slippageTolerance = limit
    );

    this.subs = [user$, slippageTolerange$];

    //Adding explorer URL here
    this.binanceExplorerUrl = `${this.explorerPathsService.binanceExplorerUrl}/tx`;
    this.bitcoinExplorerUrl = `${this.explorerPathsService.bitcoinExplorerUrl}/tx`;
    this.ethereumExplorerUrl = `${this.explorerPathsService.ethereumExplorerUrl}/tx`;
    this.thorchainExplorerUrl = `${this.explorerPathsService.thorchainExplorerUrl}/txs`;

  }

  ngOnInit() {

    // const asset = this.swapData.sourceAsset;
    const sourceAsset = this.swapData.sourceAsset;
    if (sourceAsset.chain === 'ETH') {

      // ESTIMATE GAS HERE
      // const memo =
      this.estimateEthGasPrice();

    } else {
      this.loading = false;
    }

  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['swapData']) {
      console.log(this.swapData);
    }
  }

  closeDialog(transactionSucess?: boolean) {
    // this.overlayChange.emit(!this.overlay);
    // this.dialogRef.close(transactionSucess);
    this.overlaysService.setCurrentSwapView('Swap');
  }

  gotoWallet() {
    this.overlaysService.setCurrentView(MainViewsEnum.UserSetting)
  }

  noticeHandler(index: number) {
    if(index === 0)
      window.open("", "_blank");
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

            const matchingPool = currentPools.find( (pool) => pool.chain === this.swapData.sourceAsset.chain );

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
          action: TxActions.SWAP,
          isThorchainTx: true,
          symbol: this.swapData.sourceAsset.symbol,
        });
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
          action: TxActions.SWAP,
          isThorchainTx: true,
          symbol: this.swapData.sourceAsset.symbol,
        });
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
          action: TxActions.SWAP,
          isThorchainTx: true,
          symbol: this.swapData.sourceAsset.symbol,
        });
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

        const hash = await this.ethUtilsService.callDeposit({
          inboundAddress: matchingPool,
          asset: sourceAsset,
          memo: ethMemo,
          amount: amountNumber,
          ethClient
        });

        this.hash = hash.substr(2);
        this.txStatusService.addTransaction({
          chain: 'ETH',
          hash,
          ticker: 'ETH',
          status: TxStatus.PENDING,
          action: TxActions.SWAP,
          isThorchainTx: true,
          symbol: targetAsset.symbol,
        });
        this.txState = TransactionConfirmationState.SUCCESS;
      } catch (error) {
        console.error('error making transfer: ', error);
        this.error = error;
        this.txState = TransactionConfirmationState.ERROR;
      }

    }

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

          const estimatedFeeWei = await this.ethUtilsService.estimateFee({
            sourceAsset,
            ethClient,
            ethInbound,
            inputAmount: this.swapData.inputValue,
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
    // return `=:${chain}.${symbol}:${addr}:${sliplimit}`;

    // temporarily disable slip limit for testnet
    return `=:${chain}.${symbol}:${addr}`;
  }

  ngOnDestroy(): void {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
