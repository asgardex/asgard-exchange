import { Component, OnInit, OnDestroy } from '@angular/core';
import { Asset } from '../_classes/asset';
import { UserService } from '../_services/user.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Market } from '../_classes/market';
import {
  bn,
  getSwapOutput,
  getDoubleSwapOutput,
  getSwapSlip,
  getDoubleSwapSlip,
  baseAmount,
  BaseAmount,
  PoolData,
  assetToBase,
  assetAmount,
  getValueOfAssetInRune,
  getValueOfRuneInAsset,
  getValueOfAsset1InAsset2, getSwapFee, formatBN
} from '@thorchain/asgardex-util';
import BigNumber from 'bignumber.js';
import { PoolDetail } from '../_classes/pool-detail';
import { MidgardService } from '../_services/midgard.service';
import { AssetBalance } from '../_classes/asset-balance';
import { BinanceService } from '../_services/binance.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmSwapModalComponent } from './confirm-swap-modal/confirm-swap-modal.component';
import { User } from '../_classes/user';
import { baseToToken, tokenAmount, TokenAmount } from '@thorchain/asgardex-token';
import { ThrowStmt } from '@angular/compiler';

export enum SwapType {
  DOUBLE_SWAP = 'double_swap',
  SINGLE_SWAP = 'single_swap',
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
    }

  }
  private _sourceAssetUnit: number;
  private _sourceAssetTokenValue: BaseAmount;

  get selectedSourceAsset() {
    return this._selectedSourceAsset;
  }
  set selectedSourceAsset(asset: Asset) {
    this._selectedSourceAsset = asset;

    if (this._selectedSourceAsset && this._selectedSourceAsset.symbol !== this.runeSymbol) {
      this.getPoolDetails(this._selectedSourceAsset.symbol);
    } else if (this._selectedSourceAsset && this._selectedSourceAsset.symbol === this.runeSymbol) {
      this.updateSwapDetails();
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

    if (this._selectedTargetAsset && this._selectedTargetAsset.symbol !== this.runeSymbol) {
      this.getPoolDetails(this._selectedTargetAsset.symbol);
    } else if (this._selectedTargetAsset && this._selectedTargetAsset.symbol === this.runeSymbol) {
      this.updateSwapDetails();
    }

  }
  private _selectedTargetAsset: Asset;
  targetPoolDetail: PoolDetail;

  poolDetailMap: {
    [key: string]: PoolDetail
  } = {};
  balances: AssetBalance[];
  markets: Market[];
  subs: Subscription[];

  slip: number;
  runeTransactionFee: number;
  user: User;
  basePrice: number;

  binanceTransferFee: BigNumber;
  binanceTransferFeeDisplay: number;


  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private midgardService: MidgardService,
    private binanceService: BinanceService) {

    this.selectedSourceAsset = new Asset(this.runeSymbol);
    console.log('selected from asset is: ', this.selectedSourceAsset);

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {
        console.log('BALANCES ARE: ', balances);
        this.balances = balances;
      }
    );

    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );

    this.subs = [balances$, user$];

  }

  ngOnInit(): void {
    this.getMarkets();
    this.getConstants();
    this.getBinanceFees();
    this.getPoolAddresses();
  }

  getPoolAddresses() {
    this.midgardService.getProxiedPoolAddresses().subscribe(
      (res) => {
        console.log('POOL ADDRESSES ARE: ', res);
      }
    );
  }

  openConfirmationDialog() {
    const dialogRef = this.dialog.open(
      ConfirmSwapModalComponent,
      {
        width: '50vw',
        maxWidth: '420px',
        data: {
          sourceAsset: this.selectedSourceAsset,
          targetAsset: this.selectedTargetAsset,
          runeFee: this.runeTransactionFee,
          bnbFee: this.binanceTransferFeeDisplay,
          basePrice: this.basePrice,
          inputValue: this.sourceAssetUnit,
          outputValue: this.targetAssetUnit.div(10 ** 8),
          user: this.user
        }
      }
    );

    dialogRef.afterClosed().subscribe( (transactionSuccess: boolean) => {

      if (transactionSuccess) {
        console.log('RESULT IS: ', transactionSuccess);

        this.targetAssetUnit = null;
        this.sourceAssetUnit = null;
        this.selectedTargetAsset = null;
        this.selectedSourceAsset = new Asset(this.runeSymbol);
        this.basePrice = null;
      }

    });
  }

  getPoolDetails(symbol: string) {
    this.midgardService.getPoolDetails(symbol).subscribe(
      async (res) => {
        console.log('pool details are: ', res);

        if (res && res.length > 0) {
          this.poolDetailMap[symbol] = res[0];
          this.updateSwapDetails();
        }

      },
      (err) => console.error('error fetching pool details: ', err)
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

  async getMarkets() {
    this.markets = await this.userService.getMarkets();
  }

  updateSwapDetails() {
    if (this.selectedSourceAsset && this.selectedTargetAsset) {
      this.calculateTargetUnits();
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
          && this.poolDetailMap[this.selectedTargetAsset.symbol]
          && this.poolDetailMap[this.selectedSourceAsset.symbol]) {

        this.calculateDoubleSwap();

      } else {
        console.error('swap type is undefined: ', swapType);
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
      ? this.poolDetailMap[this.selectedSourceAsset.symbol]
      : this.poolDetailMap[this.selectedTargetAsset.symbol];

    console.log('pool detail from midgard is: ', poolDetail);

    const pool: PoolData = {
      assetBalance: baseAmount(poolDetail.assetDepth),
      runeBalance: baseAmount(poolDetail.runeDepth),
    };

    console.log('source asset is: ', this.selectedSourceAsset.symbol);
    console.log('target asset is: ', this.selectedTargetAsset.symbol);

    console.log('pool assetBalance is: ', pool.assetBalance.amount().toNumber());
    console.log('pool runeBalance is: ', pool.runeBalance.amount().toNumber());

    console.log('raw input is: ', this._sourceAssetTokenValue.amount().toNumber());

    const totalMinusRuneFee = this.getAmountAfterRuneFee(
      tokenAmount(this._sourceAssetTokenValue.amount()),
      toRune ? this.selectedSourceAsset.symbol : this.runeSymbol
    );

    console.log('TOTAL MINUS FEE: ', totalMinusRuneFee.amount().toNumber());

    /**
     * TO SHOW BASE PRICE
     */
    // if (toRune) {
    //   totalAmount = getValueOfAssetInRune(baseAmount(totalMinusRuneFee.amount()), pool); // Asset to RUNE
    //   console.log('value of Asset in Rune is: ', totalAmount.amount().toNumber());
    // } else {
    //   totalAmount = getValueOfRuneInAsset(baseAmount(totalMinusRuneFee.amount()), pool); // RUNE to Asset
    //   console.log('value of Rune in Asset is: ', totalAmount.amount().toNumber());
    // }

    const basePrice = (toRune)
      ? getValueOfAssetInRune(assetToBase(assetAmount(1)), pool)
      : getValueOfRuneInAsset(assetToBase(assetAmount(1)), pool);

    this.basePrice = basePrice.amount().div(10 ** 8).toNumber();
    console.log('the base price is: ', this.basePrice);


    // const basePrice = getSwapOutput(assetToBase(assetAmount(1)), pool, toRune);

    /**
     * Slip percentage after RUNE fee subtracted
     */
    const slip = getSwapSlip(baseAmount(totalMinusRuneFee.amount()), pool, toRune);
    this.slip = slip.toNumber();
    console.log('the slip (using input MINUS RUNE FEE) is: ', this.slip);

    /**
     * Total output amount in target units
     */
    const totalAmount = getSwapOutput(baseAmount(totalMinusRuneFee.amount()), pool, toRune);
    console.log('totalAmount is: ', totalAmount.amount().toNumber());
    // this.basePrice = basePrice.amount().div(10 ** 8).toNumber();




    const total = totalAmount.amount();

    console.log('total: ', total.toNumber());

    // const slipAmount = total.multipliedBy(this.slip);

    // console.log('total * slip is: ', slipAmount.toNumber());

    // console.log('total minus slip ==> final number is: ', total.minus(slipAmount).toNumber());

    // this.targetAssetUnit = total.minus(slipAmount);

    this.targetAssetUnit = total;

  }

  /**
   * Asset <==> Asset
   * RUNE is not being directly exchanged
   * For example DAI <==> BUSD
   */
  calculateDoubleSwap() {

    const sourcePool = this.poolDetailMap[this.selectedSourceAsset.symbol];
    const pool1: PoolData = {
      assetBalance: assetToBase(assetAmount(sourcePool.assetDepth)),
      runeBalance: assetToBase(assetAmount(sourcePool.runeDepth)),
    };

    const targetPool = this.poolDetailMap[this.selectedTargetAsset.symbol];
    const pool2: PoolData = {
      assetBalance: assetToBase(assetAmount(targetPool.assetDepth)),
      runeBalance: assetToBase(assetAmount(targetPool.runeDepth)),
    };

    const doubleSwapOutput = getDoubleSwapOutput(assetToBase(assetAmount(1)), pool1, pool2);
    const doubleSwapOutputDisplay = doubleSwapOutput.amount().div(10 ** 8).toNumber();
    this.basePrice = doubleSwapOutputDisplay;


    /**
     * TODO: reduce 1 RUNE + BNB fee from Input Amount
     */
    const slip = getDoubleSwapSlip(this._sourceAssetTokenValue, pool1, pool2);
    this.slip = slip.toNumber();
    console.log('slip is: ', this.slip.toPrecision().toString());

    const total = getValueOfAsset1InAsset2(this._sourceAssetTokenValue, pool1, pool2);

    const totalMinusRuneFee = this.getAmountAfterRuneFee(
      tokenAmount(total.amount()),
      this.selectedTargetAsset.symbol
    );

    this.targetAssetUnit = totalMinusRuneFee.amount();


  }

  /**
   * get token amount after bnb fee (subtract the fee for only bnb asset)
   */
  // getAmountAfterBnbFee(value: TokenAmount, symbol: string): TokenAmount {
  //   if (symbol.toUpperCase() !== 'BNB') {
  //     return value;
  //   }

  //   const feeAsTokenAmount = baseToToken(baseAmount(this.binanceTransferFee)).amount();
  //   // const thresholdAmount = thresholdBnbAmount.amount();

  //   const amountAfterBnbFee = value.amount().minus(feeAsTokenAmount);

  //   if (amountAfterBnbFee.isLessThan(0)) {
  //     return tokenAmount(0);
  //   }

  //   // if (amountAfterBnbFee.isGreaterThan(thresholdAmount)) {
  //   //   return tokenAmount(thresholdAmount);
  //   // }

  //   return tokenAmount(amountAfterBnbFee);
  // }

  /**
   * get asset amount after 1 RUNE Fee (for thorchain fee, not binance)
   * @param value asset amount
   * @param symbol asset symbol
   */
  getAmountAfterRuneFee(
    value: TokenAmount,
    symbol: string,
  ): TokenAmount {
    const runeFee = bn(this.getRuneFeeAmount(symbol));
    const feeBn = assetToBase(assetAmount(runeFee)).amount();

    return value.amount().isGreaterThan(feeBn)
      ? tokenAmount(value.amount().minus(feeBn))
      : tokenAmount(0);
  }

  /**
   * calculate the asset amount of 1 RUNE value
   * @param symbol asset symbol
   */
  getRuneFeeAmount(symbol: string): BigNumber {

    const runePrice = bn(1);

    const curTokenPrice = (symbol === this.runeSymbol) ? runePrice : bn(this.poolDetailMap[symbol].price);

    return runePrice.dividedBy(curTokenPrice);
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
