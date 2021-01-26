import { Component, OnInit, OnDestroy } from '@angular/core';
import { Asset } from '../_classes/asset';
import { UserService } from '../_services/user.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  bn,
  getSwapOutputWithFee,
  getDoubleSwapOutput,
  getDoubleSwapOutputWithFee,
  getSwapSlip,
  getDoubleSwapSlip,
  baseAmount,
  BaseAmount,
  PoolData,
  assetToBase,
  assetAmount,
  getValueOfAssetInRune,
  getValueOfRuneInAsset,
} from '@thorchain/asgardex-util';
import BigNumber from 'bignumber.js';
import { PoolDetail } from '../_classes/pool-detail';
import { MidgardService } from '../_services/midgard.service';
import { BinanceService } from '../_services/binance.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmSwapModalComponent } from './confirm-swap-modal/confirm-swap-modal.component';
import { User } from '../_classes/user';
import { Balances } from '@xchainjs/xchain-client';
import { CGCoinListItem, CoinGeckoService } from '../_services/coin-gecko.service';
import { AssetAndBalance } from '../_classes/asset-and-balance';

export enum SwapType {
  DOUBLE_SWAP = 'double_swap',
  SINGLE_SWAP = 'single_swap',
}

export interface SwapData {
  sourceAsset;
  targetAsset;
  runeFee: number;
  bnbFee: number;
  basePrice: number;
  inputValue: number;
  outputValue;
  user: User;
  slip: number;
  balance: number;
  sourceAssetPrice: number;
  targetAssetPrice: number;
}

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss']
})
export class SwapComponent implements OnInit, OnDestroy {

  runeSymbol = environment.network === 'chaosnet' ? 'RUNE-B1A' : 'RUNE-67C';

  /**
   * From
   */
  get sourceAssetUnit() {
    return this._sourceAssetUnit;
  }
  set sourceAssetUnit(val: number) {

    this._sourceAssetUnit = val;
    this._sourceAssetTokenValue = assetToBase(assetAmount(val));

    if (val) {
      this.updateSwapDetails();
    } else {
      this.targetAssetUnit = null;
      this.slip = 0;
    }

  }
  private _sourceAssetUnit: number;
  private _sourceAssetTokenValue: BaseAmount;

  get selectedSourceAsset() {
    return this._selectedSourceAsset;
  }
  set selectedSourceAsset(asset: Asset) {

    if (this.selectedSourceAsset) {
      this.targetAssetUnit = null;
      this.calculatingTargetAsset = true;
    }

    this._selectedSourceAsset = asset;

    if (this._selectedSourceAsset && this._selectedSourceAsset.symbol !== this.runeSymbol) {
      this.getPoolDetails(this._selectedSourceAsset.chain, this._selectedSourceAsset.symbol, 'source');
    } else if (this._selectedSourceAsset && this._selectedSourceAsset.symbol === this.runeSymbol) {
      this.updateSwapDetails();
    }

    this.sourceBalance = this.userService.findBalance(this.balances, asset);

    /**
     * If input value is more than balance of newly selected asset
     * set the input to the max
     */
    if (this.sourceBalance < this.sourceAssetUnit) {
      this.sourceAssetUnit = this.sourceBalance;
    }

  }
  private _selectedSourceAsset: Asset;
  selectedSourceBalance: number;
  sourcePoolDetail: PoolDetail;

  /**
   * To
   */
  get targetAssetUnit() {
    return this._targetAssetUnit;
  }
  set targetAssetUnit(val: BigNumber) {
    this._targetAssetUnit = val;
    this.targetAssetUnitDisplay = (val) ? Number(val.div(10 ** 8).toPrecision()) : null;
  }
  private _targetAssetUnit: BigNumber;

  targetAssetUnitDisplay: number;

  get selectedTargetAsset() {
    return this._selectedTargetAsset;
  }
  set selectedTargetAsset(asset: Asset) {
    this._selectedTargetAsset = asset;

    this.targetAssetUnit = null;
    this.calculatingTargetAsset = true;

    if (this._selectedTargetAsset && this._selectedTargetAsset.symbol !== this.runeSymbol) {
      this.getPoolDetails(this._selectedTargetAsset.chain, this._selectedTargetAsset.symbol, 'target');
    } else if (this._selectedTargetAsset && this._selectedTargetAsset.symbol === this.runeSymbol) {
      this.updateSwapDetails();
    }

    this.targetBalance = this.userService.findBalance(this.balances, asset);

  }
  private _selectedTargetAsset: Asset;
  targetPoolDetail: PoolDetail;

  poolDetailMap: {
    [key: string]: PoolDetail
  } = {};
  subs: Subscription[];

  slip: number;
  runeTransactionFee: number;
  user: User;
  basePrice: number;

  binanceTransferFee: BigNumber;
  binanceTransferFeeDisplay: number;

  balances: Balances;
  sourceBalance: number;
  targetBalance: number;

  calculatingTargetAsset: boolean;
  poolDetailTargetError: boolean;
  poolDetailSourceError: boolean;

  insufficientBnb: boolean;
  coinGeckoList: CGCoinListItem[];

  selectableMarkets: AssetAndBalance[];
  overlayShow: boolean;
  targetMarketShow: boolean;
  sourceMarketShow: boolean;
  swapData: SwapData;
  confirmShow: boolean;

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private midgardService: MidgardService,
    private binanceService: BinanceService,
    private cgService: CoinGeckoService) {

    this.selectableMarkets = undefined;
    // Just in case at the begining There is no Source Asset yet.
    // this.selectedSourceAsset = new Asset(`BNB.${this.runeSymbol}`);
    this.overlayShow = false;
    this.targetMarketShow = false;
    this.sourceMarketShow = false;
    this.confirmShow = false;

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {
        this.balances = balances;
        this.sourceBalance = this.userService.findBalance(this.balances, this.selectedSourceAsset);
        this.targetBalance = this.userService.findBalance(this.balances, this.selectedTargetAsset);

        const bnbBalance = this.userService.findBalance(this.balances, new Asset('BNB.BNB'));
        this.insufficientBnb = bnbBalance < 0.000375;

        if (this.selectedTargetAsset && this.selectedTargetAsset.symbol !== this.runeSymbol) {
          this.getPoolDetails(this.selectedTargetAsset.chain, this.selectedTargetAsset.symbol, 'target');
        }

        if (this.selectedSourceAsset && this.selectedSourceAsset.symbol !== this.runeSymbol) {
          console.log('SOURCE IS: ', this.selectedSourceAsset);

          this.getPoolDetails(this.selectedSourceAsset.chain, this.selectedSourceAsset.symbol, 'source');
        }

      }
    );


    const user$ = this.userService.user$.subscribe(
      async (user) => {
        this.user = user;
      }
    );

    this.subs = [balances$, user$];

  }

  ngOnInit(): void {
    this.getConstants();
    this.getBinanceFees();
    this.getCoinGeckoCoinList();
    this.getPools();
  }

  mainButtonText(): string {

    if (!this.user || !this.balances) {
      return 'Please connect wallet';
    }
    else if (!this.selectedTargetAsset) {
      return 'Select a token';
    }
    else if (!this.sourceAssetUnit) {
      return 'Enter an amount';
    }
    else if (this.sourceAssetUnit > this.userService.maximumSpendableBalance(this.selectedSourceAsset, this.sourceBalance)) {
      return 'Insufficient balance';
    } else if (this.selectedSourceAsset.chain === 'BNB' && this.insufficientBnb) {
      return 'Insufficient BNB for Fee';
    } else if (this.user && this.sourceAssetUnit && this.sourceAssetUnit <= this.sourceBalance && this.selectedTargetAsset) {
      return 'Swap';
    } else {
      console.warn('error creating main button text');
    }

  }

  getPools() {
    this.midgardService.getPools().subscribe(
      (res) => {
        const sortedByName = res.sort();
        this.selectableMarkets = sortedByName.map((poolName) => ({
          asset: new Asset(poolName),
        }));

        // Keeping RUNE at top by default
        this.selectableMarkets.unshift({
          asset: new Asset(
            environment.network === 'chaosnet' ? 'BNB.RUNE-B1A' : 'BNB.RUNE-67C'
          ),
        });
      },
      (err) => console.error('error fetching pools:', err)
    );
  }

  getCoinGeckoCoinList() {

    this.cgService.getCoinList().subscribe( (res) => {
      this.coinGeckoList = res;
    });

  }

  formInvalid(): boolean {

    return !this.sourceAssetUnit || !this.selectedSourceAsset || !this.selectedTargetAsset || !this.targetAssetUnit
      || (this.selectedSourceAsset && this.sourceBalance
        && (this.sourceAssetUnit > this.userService.maximumSpendableBalance(this.selectedSourceAsset, this.sourceBalance)))
      || !this.user || !this.balances
      || (this.selectedSourceAsset.chain === 'BNB' && this.insufficientBnb); // source is BNB and not enough funds to cover fee
  }

  openConfirmationDialog() {
    const output = this.targetAssetUnit.div(10 ** 8);
    console.log(output);

    const id = this.cgService.getCoinIdBySymbol(this.selectedSourceAsset.ticker, this.coinGeckoList);

    if (id) {
      let sourceAssetPrice;
      let targetAssetPrice;

      console.log('check balance');

      this.cgService.getCurrencyConversion(id).subscribe(
        (res) => {
          console.log(res)

          for (const [_key, value] of Object.entries(res)) {
            sourceAssetPrice = value.usd;

            const id = this.cgService.getCoinIdBySymbol(this.selectedTargetAsset.ticker, this.coinGeckoList);

            if (id) {
              console.log('check balance');

              this.cgService.getCurrencyConversion(id).subscribe(
                (res) => {
                  console.log(res)

                  for (const [_key, value] of Object.entries(res)) {
                    targetAssetPrice = value.usd;
                    
                    this.swapData = {
                      sourceAsset: this.selectedSourceAsset,
                      targetAsset: this.selectedTargetAsset,
                      runeFee: this.runeTransactionFee,
                      bnbFee: this.binanceTransferFeeDisplay,
                      basePrice: this.basePrice,
                      inputValue: this.sourceAssetUnit,
                      outputValue: output,
                      user: this.user,
                      slip: this.slip,
                      balance: this.sourceBalance,
                      sourceAssetPrice,
                      targetAssetPrice,
                    }

                    console.log(this.swapData);

                    this.confirmShow = true;

                  }
                }
              );

            }

          }
        }
      );

    }

    
    // const dialogRef = this.dialog.open(
    //   ConfirmSwapModalComponent,
    //   {
    //     minWidth: '260px',
    //     maxWidth: '420px',
    //     width: '50vw',
    //     data: {
    //       sourceAsset: this.selectedSourceAsset,
    //       targetAsset: this.selectedTargetAsset,
    //       runeFee: this.runeTransactionFee,
    //       bnbFee: this.binanceTransferFeeDisplay,
    //       basePrice: this.basePrice,
    //       inputValue: this.sourceAssetUnit,
    //       outputValue: this.targetAssetUnit.div(10 ** 8),
    //       user: this.user,
    //       slip: this.slip
    //     }
    //   }
    // );

    // dialogRef.afterClosed().subscribe( (transactionSuccess: boolean) => {

    //   if (transactionSuccess) {
    //     this.targetAssetUnit = null;
    //     this.sourceAssetUnit = null;
    //   }

    // });
  }

  getPoolDetails(chain: string, symbol: string, type: 'source' | 'target') {

    this.poolDetailTargetError = (type === 'target') ? false : this.poolDetailTargetError;
    this.poolDetailSourceError = (type === 'source') ? false : this.poolDetailSourceError;

    this.midgardService.getPoolDetails([`${chain}.${symbol}`], 'simple').subscribe(
      (res) => {

        if (res && res.length > 0) {
          this.poolDetailMap[`${chain}.${symbol}`] = res[0];
          this.updateSwapDetails();
        }

      },
      (err) => {
        console.error('error fetching pool details: ', err);
        this.poolDetailTargetError = (type === 'target') ? true : this.poolDetailTargetError;
        this.poolDetailSourceError = (type === 'source') ? true : this.poolDetailSourceError;
      }
    );
  }

  getConstants() {
    this.midgardService.getConstants().subscribe(
      (res) => {
        this.runeTransactionFee = bn(res.int_64_values.TransactionFee).div(10 ** 8).toNumber();
      },
      (err) => console.error('error fetching constants: ', err)
    );
  }

  getBinanceFees() {
    this.binanceService.getBinanceFees().subscribe(
      (res) => {
        const binanceFees = res;
        const binanceTransferFees = this.binanceService.getTransferFees(binanceFees);
        this.binanceTransferFee = binanceTransferFees.single.amount();
        this.binanceTransferFeeDisplay = this.binanceTransferFee.div(10 ** 8).toNumber();
      }
    );
  }

  updateSwapDetails() {
    if (this.selectedSourceAsset && this.selectedTargetAsset) {
      this.calculateTargetUnits();
    } else {
      this.calculatingTargetAsset = false;
    }
  }

  async calculateTargetUnits() {

    if (this._sourceAssetTokenValue) {

      const swapType = this.selectedSourceAsset.symbol === this.runeSymbol || this.selectedTargetAsset.symbol === this.runeSymbol
        ? SwapType.SINGLE_SWAP
        : SwapType.DOUBLE_SWAP;

      if (swapType === SwapType.SINGLE_SWAP) {
        this.calculateSingleSwap();
      } else if (swapType === SwapType.DOUBLE_SWAP
          && this.poolDetailMap[`${this.selectedTargetAsset.chain}.${this.selectedTargetAsset.symbol}`]
          && this.poolDetailMap[`${this.selectedSourceAsset.chain}.${this.selectedSourceAsset.symbol}`]) {

        this.calculateDoubleSwap();

      }

    } else {
      this.calculatingTargetAsset = false;
    }

  }

  reverseTransaction() {

    if (this.selectedSourceAsset && this.selectedTargetAsset) {

      const source = this.selectedSourceAsset;
      const target = this.selectedTargetAsset;
      const targetInput = this.targetAssetUnit;
      const targetBalance = this.targetBalance;

      this.selectedTargetAsset = source;
      this.selectedSourceAsset = target;

      if (targetBalance && targetInput) {

        const max = this.userService.maximumSpendableBalance(target, targetBalance);

        this.sourceAssetUnit = (targetBalance < targetInput.div(10 ** 8 ).toNumber()) // if target balance is less than target input
          ? max // use balance
          : targetInput.div(10 ** 8 ).toNumber(); // otherwise use input value
      } else {
        this.sourceAssetUnit = (targetInput) ? targetInput.div(10 ** 8 ).toNumber() : 0;
      }

    }

  }

  /**
   * When RUNE is one of the assets being exchanged
   * For example RUNE <==> DAI
   */
  calculateSingleSwap() {

    const toRune = this.selectedTargetAsset.symbol === this.runeSymbol
      ? true
      : false;

    const poolDetail = (toRune)
      ? this.poolDetailMap[`${this.selectedSourceAsset.chain}.${this.selectedSourceAsset.symbol}`]
      : this.poolDetailMap[`${this.selectedTargetAsset.chain}.${this.selectedTargetAsset.symbol}`];

    if (poolDetail) {
      const pool: PoolData = {
        assetBalance: baseAmount(poolDetail.assetDepth),
        runeBalance: baseAmount(poolDetail.runeDepth),
      };

      /**
       * TO SHOW BASE PRICE
       */

      const valueOfRuneInAsset = getValueOfRuneInAsset(assetToBase(assetAmount(1)), pool);
      const valueOfAssetInRune = getValueOfAssetInRune(assetToBase(assetAmount(1)), pool);

      const basePrice = (toRune)
        ? valueOfRuneInAsset
        : valueOfAssetInRune;
      this.basePrice = basePrice.amount().div(10 ** 8).toNumber();

      /**
       * Slip percentage using original input
       */
      const slip = getSwapSlip(this._sourceAssetTokenValue, pool, toRune);
      this.slip = slip.toNumber();

      /**
       * Total output amount in target units minus 1 RUNE
       */
      const totalAmount = getSwapOutputWithFee(baseAmount(this._sourceAssetTokenValue.amount()), pool, toRune);

      if (this.sourceAssetUnit) {
        this.targetAssetUnit = (totalAmount.amount().isLessThan(0)) ? bn(0) : totalAmount.amount();
      } else {
        this.targetAssetUnit = (this.sourceAssetUnit) ? (totalAmount.amount().isLessThan(0)) ? bn(0) : totalAmount.amount() : null;
      }
    }

    this.calculatingTargetAsset = false;

  }

  /**
   * Asset <==> Asset
   * RUNE is not being directly exchanged
   * For example DAI <==> BUSD
   */
  calculateDoubleSwap() {

    const sourcePool = this.poolDetailMap[`${this.selectedSourceAsset.chain}.${this.selectedSourceAsset.symbol}`];
    const targetPool = this.poolDetailMap[`${this.selectedTargetAsset.chain}.${this.selectedTargetAsset.symbol}`];

    console.log('source pool is: ', sourcePool);
    console.log('target pool is: ', targetPool);

    if (sourcePool && targetPool) {
      const pool1: PoolData = {
        assetBalance: baseAmount(sourcePool.assetDepth),
        runeBalance: baseAmount(sourcePool.runeDepth),
      };
      const pool2: PoolData = {
        assetBalance: baseAmount(targetPool.assetDepth),
        runeBalance: baseAmount(targetPool.runeDepth),
      };

      const basePrice = getDoubleSwapOutput(assetToBase(assetAmount(1)), pool1, pool2);
      this.basePrice = basePrice.amount().div(10 ** 8).toNumber();

      const slip = getDoubleSwapSlip(this._sourceAssetTokenValue, pool1, pool2);
      this.slip = slip.toNumber();

      const total = getDoubleSwapOutputWithFee(this._sourceAssetTokenValue, pool1, pool2);

      if (this.sourceAssetUnit) {
        this.targetAssetUnit = (total.amount().isLessThan(0)) ? bn(0) : total.amount();
      } else {
        this.targetAssetUnit = null;
      }

    }

    this.calculatingTargetAsset = false;

  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
