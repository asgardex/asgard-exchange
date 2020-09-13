import { Component, OnInit, OnDestroy } from '@angular/core';
import { MarketListItem } from '../_components/markets-modal/markets-list-item';
import { UserService } from '../_services/user.service';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Market } from '../_classes/market';
import {
  bn,
  getSwapOutput,
  getSwapSlip,
  BaseAmount,
  PoolData,
  assetToBase,
  assetAmount,
  getValueOfRuneInAsset
} from '@thorchain/asgardex-util';
import BigNumber from 'bignumber.js';
import { PoolDetail } from '../_classes/pool-detail';
import { MidgardService } from '../_services/midgard.service';
import { AssetData } from '../_classes/asset-data';
import { BinanceService } from '../_services/binance.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmSwapModalComponent } from './confirm-swap-modal/confirm-swap-modal.component';
import { string, number } from 'is_js';
import { User } from '../_classes/user';

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
      this.handleUnitChange();
    } else {
      this.targetAssetUnit = null;
    }

  }
  private _sourceAssetUnit: number;

  private _sourceAssetTokenValue: BaseAmount;

  get selectedSourceAsset() {
    return this._selectedSourceAsset;
  }
  set selectedSourceAsset(asset: MarketListItem) {
    this._selectedSourceAsset = asset;

    if (this._selectedSourceAsset && this._selectedSourceAsset.asset.symbol !== this.runeSymbol) {
      this.getPoolDetails(this._selectedSourceAsset.asset.symbol);
    }

  }
  private _selectedSourceAsset: MarketListItem;
  selectedSourceBalance: number;
  sourcePoolDetail: PoolDetail;

  user: User;

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
  set selectedTargetAsset(asset: MarketListItem) {
    this._selectedTargetAsset = asset;

    if (this._selectedTargetAsset && this._selectedTargetAsset.asset.symbol !== this.runeSymbol) {
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

  slip: number;
  binanceTransferFee: number;
  runeTransactionFee: number;

  basePrice: number;


  constructor(
    private dialog: MatDialog,
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
          bnbFee: this.binanceTransferFee,
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
        this.selectedSourceAsset = new MarketListItem(this.runeSymbol);
        this.basePrice = null;
        // this.selectedAssetChange.emit(result);
      }

    });
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

  getBinanceFees() {
    this.binanceService.getBinanceFees().subscribe(
      (res) => {
        const binanceFees = res;
        console.log('BINANCE FEES ARE: ', res);
        const binanceTransferFees = this.binanceService.getTransferFees(binanceFees);
        console.log('TRANSFER FEES ARE: ', binanceTransferFees);

        this.binanceTransferFee = binanceTransferFees.single.amount().div(10 ** 8).toNumber();
        // console.log('amount is: ', single.amount().toJSON());
        // const other = baseToToken(single);

        // console.log('other: ', other.amount().toJSON());

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

      const baseOutput = getSwapOutput(assetToBase(assetAmount(1)), pool, false);
      const baseOutputDisplay = baseOutput.amount().div(10 ** 8).toNumber();
      this.basePrice = baseOutputDisplay;
      console.log('this base price is: ', this.basePrice);

      const swapOutput = getSwapOutput(this._sourceAssetTokenValue, pool, false);
      const val = swapOutput.amount().div(10 ** 8).toPrecision();
      console.log('swapOutput IS: ', val);

      // const swapInput = getSwapInput(false, pool, swapOutput);
      // const swapInputStr = swapInput.amount().div(10 ** 8).toPrecision();
      // console.log('swapOutput IS: ', swapInputStr);

      /**
       * TODO: reduce 1 RUNE + BNB fee from Input Amount
       */
      const slip = getSwapSlip(this._sourceAssetTokenValue, pool, false);
      this.slip = slip.multipliedBy(100).toNumber();
      console.log('slip is: ', this.slip.toPrecision().toString());

      // const fee = getSwapFee(this._sourceAssetTokenValue, pool, false);
      // const feeStr = fee.amount().div(10 ** 8).toNumber();
      // console.log('feeStr is: ', feeStr);
      // this.fee = feeStr;

      const valRuneInAsset = getValueOfRuneInAsset(this._sourceAssetTokenValue, pool);
      const valRuneInAssetStr = valRuneInAsset.amount().div(10 ** 8).toPrecision();
      console.log('valRuneInAssetStr is: ', valRuneInAssetStr);

      const total = valRuneInAsset.amount();

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
