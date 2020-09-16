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
      this.slip = 0;
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

    this.sourceBalance = this.updateBalance(asset);

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

    this.targetBalance = this.updateBalance(asset);

  }
  private _selectedTargetAsset: Asset;
  targetPoolDetail: PoolDetail;

  poolDetailMap: {
    [key: string]: PoolDetail
  } = {};
  markets: Market[];
  subs: Subscription[];

  slip: number;
  runeTransactionFee: number;
  user: User;
  basePrice: number;

  binanceTransferFee: BigNumber;
  binanceTransferFeeDisplay: number;

  balances: AssetBalance[];
  sourceBalance: number;
  targetBalance: number;


  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private midgardService: MidgardService,
    private binanceService: BinanceService) {

    this.selectedSourceAsset = new Asset(this.runeSymbol);

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {
        this.balances = balances;
        this.sourceBalance = this.updateBalance(this.selectedSourceAsset);
        this.targetBalance = this.updateBalance(this.selectedTargetAsset);
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

    console.log('network is: ', environment.network);

  }

  updateBalance(asset: Asset): number {
    if (this.balances && asset) {
      const match = this.balances.find( (balance) => balance.asset === asset.symbol );

      if (match) {
        return match.assetValue.amount().toNumber();
      } else {
        return 0.0;
      }
    }
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

    const pool: PoolData = {
      assetBalance: baseAmount(poolDetail.assetDepth),
      runeBalance: baseAmount(poolDetail.runeDepth),
    };

    /**
     * TO SHOW BASE PRICE
     */
    const basePrice = (toRune)
      ? getValueOfAssetInRune(assetToBase(assetAmount(1)), pool)
      : getValueOfRuneInAsset(assetToBase(assetAmount(1)), pool);
    this.basePrice = basePrice.amount().div(10 ** 8).toNumber();


    /**
     * Slip percentage using original input
     */
    const slip = getSwapSlip(this._sourceAssetTokenValue, pool, toRune);
    this.slip = slip.toNumber();


    /**
     * Total output amount in target units minus 1 RUNE
     */
    const totalAmount = getSwapOutput(baseAmount(this._sourceAssetTokenValue.amount()), pool, toRune);
    const total = totalAmount.amount().minus(basePrice.amount());

    /**
     * Subtract "Swap fee" from (total)
     */
    // const swapFee = getSwapFee(baseAmount(this._sourceAssetTokenValue.amount()), pool, toRune);
    // console.log('swap fee is: ', swapFee.amount().plus(basePrice.amount()).toNumber());
    // const totalMinusSwapFee = totalAmount.amount().minus(swapFee.amount().plus(basePrice.amount()));
    // console.log('total minus (RUNE FEE + SWAP FEE): ', totalMinusSwapFee.toNumber());

    this.targetAssetUnit = (total.isLessThan(0)) ? bn(0) : total;

  }

  /**
   * Asset <==> Asset
   * RUNE is not being directly exchanged
   * For example DAI <==> BUSD
   */
  calculateDoubleSwap() {

    const sourcePool = this.poolDetailMap[this.selectedSourceAsset.symbol];
    const pool1: PoolData = {
      assetBalance: baseAmount(sourcePool.assetDepth),
      runeBalance: baseAmount(sourcePool.runeDepth),
    };

    const targetPool = this.poolDetailMap[this.selectedTargetAsset.symbol];
    const pool2: PoolData = {
      assetBalance: baseAmount(targetPool.assetDepth),
      runeBalance: baseAmount(targetPool.runeDepth),
    };

    const basePrice = getDoubleSwapOutput(assetToBase(assetAmount(1)), pool1, pool2);
    this.basePrice = basePrice.amount().div(10 ** 8).toNumber();

    const slip = getDoubleSwapSlip(this._sourceAssetTokenValue, pool1, pool2);
    this.slip = slip.toNumber();


    const doubleSwapOutput = getDoubleSwapOutput(this._sourceAssetTokenValue, pool1, pool2);
    const total = doubleSwapOutput.amount().minus(basePrice.amount());

    this.targetAssetUnit = total;


  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
