import { Component, OnInit, OnDestroy } from '@angular/core';
import { MarketListItem, Asset } from '../_components/markets-modal/markets-list-item';
import { UserService } from '../_services/user.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  TokenAmount,
  tokenAmount,
  baseToToken,
  baseAmount,
  BaseAmount,
  tokenToBase,
} from '@thorchain/asgardex-token';
import { Market, MarketResponse } from '../_classes/market';
import {
  Client as binanceClient,
  BinanceClient,
  Balance,
  Fees,
} from '@thorchain/asgardex-binance';
import BigNumber from 'bignumber.js';
import { PoolDetail } from '../_classes/pool-detail';
import { SwapData } from '../_classes/swap-data';
import { DoubleSwapCalcData, getZValue, getSlip, getPx, getPz, getFee, SingleSwapCalcData } from '../_const/calculations';
import { bn, isValidBN } from '@thorchain/asgardex-util';
import { MidgardService } from '../_services/midgard.service';
import { BinanceService } from '../_services/binance.service';
import { TransferFees } from '../_classes/binance-fee';
import { AssetData } from '../_classes/asset-data';

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

  /**
   * From
   */
  get sourceAssetUnit() {
    return this._sourceAssetUnit;
  }
  set sourceAssetUnit(val: number) {
    this._sourceAssetUnit = val;
    this._sourceAssetTokenValue = tokenAmount(val);
    this.handleUnitChange();
  }
  private _sourceAssetUnit: number;

  private _sourceAssetTokenValue: TokenAmount;

  get selectedSourceAsset() {
    return this._selectedSourceAsset;
  }
  set selectedSourceAsset(asset: MarketListItem) {
    this._selectedSourceAsset = asset;
    this.getPoolDetails(this._selectedSourceAsset.asset.symbol);
  }
  private _selectedSourceAsset: MarketListItem;
  selectedSourceBalance: number;
  sourcePoolDetail: PoolDetail;

  /**
   * To
   */
  get targetAssetUnit() {
    return this._targetAssetUnit;
  }
  set targetAssetUnit(val: number) {
    this._targetAssetUnit = val;
    this.handleUnitChange();
  }
  private _targetAssetUnit: number;

  get selectedTargetAsset() {
    return this._selectedTargetAsset;
  }
  set selectedTargetAsset(asset: MarketListItem) {
    this._selectedTargetAsset = asset;
    this.getPoolDetails(this._selectedTargetAsset.asset.symbol);
  }
  private _selectedTargetAsset: MarketListItem;
  targetPoolDetail: PoolDetail;

  poolDetailMap: {
    [key: string]: PoolDetail
  } = {};
  assetData: AssetData[];
  markets: Market[];
  subs: Subscription[];
  binanceFees: Fees;
  feeType = 'single';
  transferFees: TransferFees;



  constructor(
    private userService: UserService,
    private midgardService: MidgardService,
    private binanceService: BinanceService) {

    this.selectedSourceAsset = new MarketListItem(environment.network === 'chaosnet' ? 'RUNE-B1A' : 'RUNE-67C');
    console.log('selected from asset is: ', this.selectedSourceAsset);

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {
        this.assetData = balances;
        this.updateSelectedFromBalance();
      }
    );

    this.subs = [balances$];

  }

  ngOnInit(): void {
    this.getMarkets();
    this.getBinanceFees();
  }

  getBinanceFees() {
    this.binanceService.getBinanceFees().subscribe(
      (res) => {
        this.binanceFees = res;
        console.log('BINANCE FEES ARE: ', res);
        this.transferFees = this.binanceService.getTransferFees(this.binanceFees);
        console.log('TRANSFER FEES ARE: ', this.transferFees);
      }
    );
  }

  getPoolDetails(symbol: string) {
    this.midgardService.getPoolDetails(symbol).subscribe(
      (res) => {
        console.log('pool details are: ', res);

        if (res && res.length > 0) {
          this.poolDetailMap[symbol] = res[0];
        }

      },
      (err) => console.error('error fetching pool details: ', err)
    );
  }

  async getMarkets() {
    this.markets = await this.userService.getMarkets();
  }

  handleAssetChange() {

    if (this.selectedSourceAsset && this.selectedTargetAsset) {

      // const {
      //   hasSufficientRuneFee,
      //   hasSufficientBnbFee,
      //   hasSufficientBnbFeeInBalance,
      //   getAmountAfterFee,
      //   getThresholdAmount,
      // } = useFee();

      const inputValueAfterRune = this.getAmountAfterFee(this._sourceAssetTokenValue, this.selectedSourceAsset.asset.symbol);

      const swapData = this.getSwapData(
        this.selectedSourceAsset.asset.symbol,
        this.selectedTargetAsset.asset.symbol,
        this.poolDetailMap[this.selectedSourceAsset.asset.symbol],
        this.poolDetailMap[this.selectedTargetAsset.asset.symbol],
        inputValueAfterRune
      );
    }

  }

  handleUnitChange() {
    if (this.selectedSourceAsset && this.selectedTargetAsset) {
      const fromTokenAmount = tokenAmount(this.sourceAssetUnit);
      const amount = fromTokenAmount.amount();
      // console.log('fromTokenAmount is: ', amount);
    }

    // const sourcePriceBN = bn(priceIndex[sourceSymbol]);
    // const sourcePrice = isValidBN(sourcePriceBN) ? sourcePriceBN : outputPrice;
    // const targetPriceBN = bn(priceIndex[targetSymbol]);
    // const targetPrice = isValidBN(targetPriceBN) ? targetPriceBN : outputPrice;

  }

  getSwapData(
    symbolFrom: string,
    symbolTo: string,
    sourcePool: PoolDetail,
    targetPool: PoolDetail,
    // pools: PoolDataMap,
    xValue: TokenAmount,
    // runePrice: BigNumber,
  ): SwapData {
    const swapType = this.getSwapType(symbolFrom, symbolTo);

    // const runePrice = validBNOrZero(priceIndex[RUNE_SYMBOL]);
    const runePrice = bn(1);

    const result: {
      symbolFrom: string;
      symbolTo: string;
    } = {
      symbolFrom,
      symbolTo,
    };

    if (swapType === SwapType.DOUBLE_SWAP) {
      const Py = runePrice;

      // pool for source asset
      // const sourcePool: PoolDetail = pools[symbolFrom];

      const sourceRuneDepth = baseAmount(sourcePool?.runeDepth ?? 0);
      const sourceAssetDepth = baseAmount(sourcePool?.assetDepth ?? 0);
      // formula: assetDepth / BASE_NUMBER
      const X = baseToToken(sourceAssetDepth);
      // formula: runeDepth / BASE_NUMBER
      const Y = baseToToken(sourceRuneDepth);

      // pool for target asset
      // const targetPool: PoolDetail = pools[symbolTo];

      const targetRuneDepth = baseAmount(targetPool?.runeDepth ?? 0);
      const targetAssetDepth = baseAmount(targetPool?.assetDepth ?? 0);
      // formula: runeDepth / BASE_NUMBER
      const R = baseToToken(targetRuneDepth);
      // formula: assetDepth / BASE_NUMBER
      const Z = baseToToken(targetAssetDepth);

      const calcData: DoubleSwapCalcData = { X, Y, R, Z, Py, Pr: Py };

      const zValue = getZValue(xValue, calcData);
      const slip = getSlip(xValue, calcData);
      const Px = getPx(xValue, calcData);
      const Pz = getPz(xValue, calcData);
      const fee = getFee(xValue, calcData);

      const limitValue = zValue.amount().multipliedBy(70 / 100);
      const slipLimit = tokenToBase(tokenAmount(limitValue));

      return {
        ...result,
        Px,
        slip,
        outputAmount: zValue,
        outputPrice: Pz,
        fee,
        slipLimit,
      };
    }

    if (swapType === SwapType.SINGLE_SWAP && (symbolTo === 'RUNE-B1A' || symbolTo === 'RUNE-67C')) {
      const Py = runePrice;

      // const poolData: PoolDetail = pools[symbolFrom];
      const poolData: PoolDetail = sourcePool;

      const runeDepth = baseAmount(poolData?.runeDepth ?? 0);
      const assetDepth = baseAmount(poolData?.assetDepth ?? 0);

      // formula: assetDepth / BASE_NUMBER
      const X = baseToToken(assetDepth);
      // formula: runeDepth / BASE_NUMBER
      const Y = baseToToken(runeDepth);

      const calcData: SingleSwapCalcData = { X, Y, Py };

      const Px = getPx(xValue, calcData);
      // formula: (xValue + X) ** 2
      const times = X.amount()
        .plus(xValue.amount())
        .pow(2);
      const xTimes = xValue.amount().pow(2);
      // formula: X ** 2
      const balanceTimes = X.amount().pow(2);
      // formula: (xValue * X * Y) / times
      const outputTokenBN = X.amount()
        .multipliedBy(Y.amount())
        .multipliedBy(xValue.amount())
        .div(times);
      // formula: (Px * (X + xValue)) / (Y - outputToken)
      const a = X.amount()
        .plus(xValue.amount())
        .multipliedBy(Px);
      const b = Y.amount().minus(outputTokenBN);
      const outputPy = a.div(b);

      // calc trade slip
      // formula: ((xValue * (2 * X + xValue)) / balanceTimes) * 100
      const slipValue = X.amount()
        .multipliedBy(2)
        .plus(xValue.amount())
        .multipliedBy(xValue.amount())
        .div(balanceTimes)
        .multipliedBy(100);
      const slip = bn(slipValue);
      // formula: (1 - 30 / 100) * outputToken * BASE_NUMBER
      const limitValue = outputTokenBN.multipliedBy(70 / 100);
      const slipLimit = tokenToBase(tokenAmount(limitValue));
      // formula: (xTimes * Y) / times
      const feeValue = Y.amount()
        .multipliedBy(xTimes)
        .div(times);
      const fee = tokenAmount(feeValue);

      return {
        ...result,
        Px,
        slip,
        outputAmount: tokenAmount(outputTokenBN),
        outputPrice: outputPy,
        slipLimit,
        fee,
      };
    }

    if (swapType === SwapType.SINGLE_SWAP && (symbolFrom === 'RUNE-B1A' || symbolFrom === 'RUNE-67C')) {
      const Px = bn(runePrice);

      // const poolData = pools[symbolTo];
      const poolData = targetPool;

      const runeDepth = baseAmount(poolData?.runeDepth ?? 0);
      const assetDepth = baseAmount(poolData?.assetDepth ?? 0);
      const X = baseToToken(runeDepth);
      const Y = baseToToken(assetDepth);

      const times = X.amount()
        .plus(xValue.amount())
        .pow(2);
      const xTimes = xValue.amount().pow(2);
      const balanceTimes = X.amount().pow(2);
      const outputTokenBN = X.amount()
        .multipliedBy(Y.amount())
        .multipliedBy(xValue.amount())
        .div(times);
      const a = X.amount()
        .plus(xValue.amount())
        .multipliedBy(Px);
      const b = Y.amount().minus(outputTokenBN);
      const outputPy = a.div(b);

      // trade slip
      // avoid division by zero
      const slip = balanceTimes.gt(0)
        ? X.amount()
            .multipliedBy(2)
            .plus(xValue.amount())
            .multipliedBy(xValue.amount())
            .div(balanceTimes)
            .multipliedBy(100)
        : bn(0);

      // formula: (1 - 30 / 100) * outputToken * BASE_NUMBER;
      const limitValue = outputTokenBN.multipliedBy(70 / 100);
      const slipLimit = tokenToBase(tokenAmount(limitValue));
      const feeValue = Y.amount()
        .multipliedBy(xTimes)
        .div(times);
      const fee = tokenAmount(feeValue);
      return {
        ...result,
        Px,
        slip,
        outputAmount: tokenAmount(outputTokenBN),
        outputPrice: outputPy,
        slipLimit,
        fee,
      };
    }

    return null;
  }

  /**
   * return the swap type - SINGLE | DOUBLE
   * @param source source asset symbol
   * @param target target asset symbol
   */
  getSwapType(source: string, target: string) {
    return source === 'RUNE-B1A' || source === 'RUNE-67C' || target === 'RUNE-B1A' || target === 'RUNE-67C'
    ? SwapType.SINGLE_SWAP
    : SwapType.DOUBLE_SWAP;
  }






  // /** used for swap only
  //  * return token amount after binance bnb fee and rune network fee
  //  * @param value input amount
  //  * @param symbol asset symbol
  //  */
  getAmountAfterFee(value: TokenAmount, symbol: string): TokenAmount {
    let totalAmount = value.amount();

    // if BNB transfer, reduce bnb fee from the input amount
    if (symbol.toUpperCase() === 'BNB') {
      totalAmount = this.getAmountAfterBnbFee(value, symbol).amount();
    }

    return this.getAmountAfterRuneFee(tokenAmount(totalAmount), symbol);
  }


  /**
   * get token amount after bnb fee (subtract the fee for only bnb asset)
   * @param value input amount
   * @param symbol asset symbol
   */
  getAmountAfterBnbFee(value: TokenAmount, symbol: string): TokenAmount {
    if (symbol.toUpperCase() !== 'BNB') {
      return value;
    }


  // bnbFeeAmount(transferFees) {
  //   const fees = RD.toNullable(transferFees);

  //   if (feeType === 'single') return fees?.single ?? baseAmount(0);
  //   return fees?.multi ?? baseAmount(0);
  // }

    const bnbFeeAmount = (this.feeType === 'single')
      ? this.transferFees?.single ?? baseAmount(0)
      : this.transferFees?.multi ?? baseAmount(0);



    const feeAsTokenAmount = baseToToken(bnbFeeAmount).amount();



    // const assetData = useSelector((state: RootState) => state.Wallet.assetData);


    const bnbWalletBalance = this.bnbBaseAmount(this.assetData);

    const minBnbBalance: BigNumber = bn(0.1);

    // const thresholdAmount = this.thresholdBnbAmount.amount();
    const thresholdAmount = this.thresholdBnbAmount(bnbFeeAmount, bnbWalletBalance, minBnbBalance);

    const amountAfterBnbFee = value.amount().minus(feeAsTokenAmount);

    if (amountAfterBnbFee.isLessThan(0)) {
      return tokenAmount(0);
    }

    if (amountAfterBnbFee.isGreaterThan(thresholdAmount.amount())) {
      return tokenAmount(thresholdAmount.amount());
    }

    return tokenAmount(amountAfterBnbFee);
  }

  /**
   * threshold bnb amount available for transaction
   */
  thresholdBnbAmount(bnbFeeAmount, bnbWalletBalance, minBnbBalance) {
    const bnbBalanceAmount = baseToToken(bnbWalletBalance)?.amount() ?? bn(0);
    const feeAsTokenAmount = baseToToken(bnbFeeAmount).amount();

    // reduce bnb fee amount
    const bnbAmountAfterFee = bnbBalanceAmount.minus(feeAsTokenAmount);

    // reduce minimum bnb amount in the balance
    const thresholdBnb = bnbAmountAfterFee.minus(minBnbBalance);

    return thresholdBnb.isGreaterThan(0)
      ? tokenAmount(thresholdBnb)
      : tokenAmount(0);
  }
  // thresholdBnbAmount: TokenAmount = useMemo(() => {
  //   const bnbBalanceAmount = baseToToken(bnbWalletBalance)?.amount() ?? bn(0);
  //   const feeAsTokenAmount = baseToToken(bnbFeeAmount).amount();

  //   // reduce bnb fee amount
  //   const bnbAmountAfterFee = bnbBalanceAmount.minus(feeAsTokenAmount);

  //   // reduce minimum bnb amount in the balance
  //   const thresholdBnb = bnbAmountAfterFee.minus(minBnbBalance);

  //   return thresholdBnb.isGreaterThan(0)
  //     ? tokenAmount(thresholdBnb)
  //     : tokenAmount(0);
  // }, [bnbFeeAmount, bnbWalletBalance, minBnbBalance]);


    /**
     * get asset amount after 1 RUNE Fee (for thorchain fee, not binance)
     * @param value asset amount
     * @param symbol asset symbol
     */
    getAmountAfterRuneFee(value: TokenAmount, symbol: string): TokenAmount {
      const runeFee = this.getRuneFeeAmount(symbol);

      return value.amount().isGreaterThan(runeFee)
        ? tokenAmount(value.amount().minus(runeFee))
        : tokenAmount(0);
    }


  /**
   * Returns BNB amount within AssetData
   * If no BNB is available, Nothing will be returned
   */
  bnbBaseAmount = (assetData: AssetData[]): BaseAmount => {
    const bnbAsset = this.getAssetDataFromBalance(assetData, 'BNB');
    const amount = bnbAsset?.assetValue;
    return amount ? tokenToBase(amount) : baseAmount(0);
  }

  /**
   * return asset data from the user's balance
   * @param assetData asset data in the user's wallet balance
   * @param symbol symbol in the balance to retrieve the data
   */
  getAssetDataFromBalance(assetData: AssetData[], symbol: string): AssetData {
    if (!symbol) {
      return null;
    }

    return (
      assetData.find(data => data.asset.toLowerCase() === symbol.toLowerCase()) ||
      null
    );
  }

  /**
   * calculate the asset amount of 1 RUNE value
   * @param symbol asset symbol
   */
  getRuneFeeAmount(symbol: string): BigNumber {

    const runePrice = bn(1);

    // const curTokenPrice = bn(priceIndex[symbol]);
    const curTokenPrice = bn(this.poolDetailMap[symbol].price);

    return runePrice.dividedBy(curTokenPrice);
  }







  // const transferFees: TransferFeesRD = useSelector(
  //   (state: RootState) => state.Binance.transferFees,
  // );


  // bnbFeeAmount(transferFees) {
  //   const fees = RD.toNullable(transferFees);

  //   if (feeType === 'single') return fees?.single ?? baseAmount(0);
  //   return fees?.multi ?? baseAmount(0);
  // }






  updateSelectedFromBalance() {

    if (this.assetData) {

      console.log('asset is: ', this.selectedSourceAsset.asset);

      const match = this.assetData.find( (balance) => balance.asset === this.selectedSourceAsset.asset.ticker );

      if (match) {
        console.log('match is: ', match);
      } else {
        this.selectedSourceBalance = 0.0;
      }
      console.log('match is: ', match);
    }

  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
