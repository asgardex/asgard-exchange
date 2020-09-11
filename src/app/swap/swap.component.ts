import { Component, OnInit, OnDestroy } from '@angular/core';
import { MarketListItem, Asset } from '../_components/markets-modal/markets-list-item';
import { UserService } from '../_services/user.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
// import {
//   TokenAmount,
//   tokenAmount,
//   baseToToken,
//   tokenToBase,
// } from '@thorchain/asgardex-token';
import { Market, MarketResponse } from '../_classes/market';
import {
  Client as binanceClient,
  BinanceClient,
  Balance,
  Fees,
} from '@thorchain/asgardex-binance';
import {
  bnOrZero,
  validBNOrZero,
  getSwapOutput,
  getSwapSlip,
  baseAmount,
  BaseAmount,
  PoolData,
  assetToBase,
  assetAmount,
  getSwapInput,
  getSwapFee,
  getValueOfRuneInAsset
} from '@thorchain/asgardex-util';
import BigNumber from 'bignumber.js';
import { PoolDetail, PoolDetailStatusEnum } from '../_classes/pool-detail';
import { bn, isValidBN } from '@thorchain/asgardex-util';
import { MidgardService } from '../_services/midgard.service';
import { TransferFees } from '../_classes/binance-fee';
import { AssetData } from '../_classes/asset-data';
import { BinanceService } from '../_services/binance.service';
import { baseToToken } from '@thorchain/asgardex-token';

export enum SwapType {
  DOUBLE_SWAP = 'double_swap',
  SINGLE_SWAP = 'single_swap',
}

export interface TokenData {
  asset: string;
  price: BigNumber;
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
    this._sourceAssetTokenValue = assetToBase(assetAmount(val - 1));
    this.handleUnitChange();
  }
  private _sourceAssetUnit: number;

  private _sourceAssetTokenValue: BaseAmount;

  get selectedSourceAsset() {
    return this._selectedSourceAsset;
  }
  set selectedSourceAsset(asset: MarketListItem) {
    this._selectedSourceAsset = asset;

    if (this._selectedSourceAsset.asset.symbol !== this.runeSymbol) {
      this.getPoolDetails(this._selectedSourceAsset.asset.symbol);
    }

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
  set targetAssetUnit(val: BigNumber) {
    this._targetAssetUnit = val;
    this.targetAssetUnitDisplay = Number(val.div(10 ** 8).toPrecision());
    console.log('target asset unit updated: ', this.targetAssetUnitDisplay);
    // this.handleUnitChange();
  }
  private _targetAssetUnit: BigNumber;

  targetAssetUnitDisplay: number;

  get selectedTargetAsset() {
    return this._selectedTargetAsset;
  }
  set selectedTargetAsset(asset: MarketListItem) {
    this._selectedTargetAsset = asset;

    if (this._selectedTargetAsset.asset.symbol !== this.runeSymbol) {
      this.getPoolDetails(this._selectedTargetAsset.asset.symbol);
    }

  }
  private _selectedTargetAsset: MarketListItem;
  targetPoolDetail: PoolDetail;

  poolDetailMap: {
    [key: string]: PoolDetail
  } = {};
  assetData: AssetData[];
  markets: Market[];
  subs: Subscription[];
  // binanceFees: Fees;
  tokensData: TokenData[];

  fee: number;
  slip: number;
  binanceTransferFees: TransferFees;
  runeTransactionFee: number;
  // swapData: {
  //   type: 'DOUBLE' | 'SINGLE'
  //   fromRune: boolean
  // };



  constructor(
    private userService: UserService,
    private midgardService: MidgardService,
    private binanceService: BinanceService) {

    this.selectedSourceAsset = new MarketListItem(this.runeSymbol);
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
    this.getConstants();
    this.getBinanceFees();
  }

  getPoolDetails(symbol: string) {
    this.midgardService.getPoolDetails(symbol).subscribe(
      async (res) => {
        console.log('pool details are: ', res);

        if (res && res.length > 0) {
          this.poolDetailMap[symbol] = res[0];
          this.handleUnitChange();
          // this.getTokensData();
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
      (err) => console.error('error fetching constants')
    );
  }


  // getTokensData() {
  //   const tokensData: TokenData[] = Object.keys(this.poolDetailMap).reduce(
  //     (result: TokenData[], tokenName: string) => {
  //       const tokenData = this.poolDetailMap[tokenName];
  //       const assetStr = tokenData?.asset;

  //       // const asset = assetStr ? this.getAssetFromString(assetStr) : null;
  //       // const price = bnOrZero(tokenData?.price);

  //       // if (
  //       //   tokenData.status &&
  //       //   tokenData.status === PoolDetailStatusEnum.Enabled
  //       // ) {
  //       //   result.push({
  //       //     asset: asset?.symbol ?? '',
  //       //     price,
  //       //   });
  //       // }
  //       return result;
  //     },
  //     [],
  //   );

  //   const runePrice = bn(1);

  //   // add rune data in the target token list
  //   tokensData.push({
  //     asset: this.runeSymbol,
  //     price: runePrice,
  //   });

  //   this.tokensData = tokensData;

  // }

  getBinanceFees() {
    this.binanceService.getBinanceFees().subscribe(
      (res) => {
        const binanceFees = res;
        console.log('BINANCE FEES ARE: ', res);
        this.binanceTransferFees = this.binanceService.getTransferFees(binanceFees);
        console.log('TRANSFER FEES ARE: ', this.binanceTransferFees);

        const single = this.binanceTransferFees.single;
        console.log('amount is: ', single.amount().toJSON());
        const other = baseToToken(single);

        console.log('other: ', other.amount().toJSON());

      }
    );
  }

  async getMarkets() {
    this.markets = await this.userService.getMarkets();
  }

  handleAssetChange() {

    if (this.selectedSourceAsset && this.selectedTargetAsset) {

      console.log('this._sourceAssetTokenValue is: ', this._sourceAssetTokenValue);
      this.calculateTargetUnits(this.poolDetailMap[this.selectedTargetAsset.asset.symbol]);

    }

  }

  handleUnitChange() {
    if (this.selectedSourceAsset && this.selectedTargetAsset) {
      // const fromTokenAmount = tokenAmount(this.sourceAssetUnit);
      // const amount = fromTokenAmount.amount();
      // console.log('fromTokenAmount is: ', amount);
      console.log('source symbol is: ', this.selectedSourceAsset.asset.symbol);
      console.log('symbol is: ', this.selectedTargetAsset.asset.symbol);

      this.calculateTargetUnits(this.poolDetailMap[this.selectedTargetAsset.asset.symbol]);
    }
  }

  async calculateTargetUnits(poolDetail: PoolDetail) {

    if (this._sourceAssetTokenValue) {
      const pool: PoolData = {
        assetBalance: assetToBase(assetAmount(poolDetail.assetDepth)),
        runeBalance: assetToBase(assetAmount(poolDetail.runeDepth)),
      };

      const swapOutput = getSwapOutput(this._sourceAssetTokenValue, pool, false);
      const val = swapOutput.amount().div(10 ** 8).toPrecision();
      console.log('swapOutput IS: ', val);

      const swapInput = getSwapInput(false, pool, swapOutput);
      const swapInputStr = swapInput.amount().div(10 ** 8).toPrecision();
      console.log('swapOutput IS: ', swapInputStr);

      const slip = getSwapSlip(this._sourceAssetTokenValue, pool, false);
      const slipStr = slip.toPrecision();
      console.log('SLIP IS: ', slipStr);
      this.slip = slip.toNumber();

      const fee = getSwapFee(this._sourceAssetTokenValue, pool, false);
      const feeStr = fee.amount().div(10 ** 8).toNumber();
      console.log('feeStr is: ', feeStr);
      this.fee = feeStr;

      const valRuneInAsset = getValueOfRuneInAsset(this._sourceAssetTokenValue, pool);
      const valRuneInAssetStr = valRuneInAsset.amount().div(10 ** 8).toPrecision();
      console.log('valRuneInAssetStr is: ', valRuneInAssetStr);

      const total = valRuneInAsset.amount().minus(fee.amount());

      this.targetAssetUnit = total;

      console.log('total is: ', total.div(10 ** 8).toPrecision());
    }

  }

  getAssets() {
    return this.midgardService.getAssets().subscribe(
      (res) => {
        console.log('get assets response is: ', res);
      },
      (err) => console.error('error is: ', err)
    );
  }

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
