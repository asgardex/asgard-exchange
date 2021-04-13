import { Component, OnInit, OnDestroy } from '@angular/core';
import { Asset } from '../_classes/asset';
import { UserService } from '../_services/user.service';
import { Subscription } from 'rxjs';
import {
  getDoubleSwapOutput,
  getSwapSlip,
  getDoubleSwapSlip,
  PoolData,
  getValueOfAssetInRune,
  getValueOfRuneInAsset,
  getSwapOutput
} from '@thorchain/asgardex-util';
import BigNumber from 'bignumber.js';
import {
  bn,
  baseAmount,
  BaseAmount,
  assetToBase,
  assetAmount,
  assetToString,
} from '@xchainjs/xchain-util';
import { PoolDetail } from '../_classes/pool-detail';
import { MidgardService } from '../_services/midgard.service';
import { BinanceService } from '../_services/binance.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmSwapModalComponent } from './confirm-swap-modal/confirm-swap-modal.component';
import { User } from '../_classes/user';
import { Balances } from '@xchainjs/xchain-client';
import { AssetAndBalance } from '../_classes/asset-and-balance';
import { PoolDTO } from '../_classes/pool';
import { SlippageToleranceService } from '../_services/slippage-tolerance.service';
import { PoolAddressDTO } from '../_classes/pool-address';
import { ThorchainPricesService } from '../_services/thorchain-prices.service';
import { EthUtilsService } from '../_services/eth-utils.service';

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

    this.ethContractApprovalRequired = false;

    if (this.selectedSourceAsset) {
      this.targetAssetUnit = null;
      this.calculatingTargetAsset = true;
    }

    this._selectedSourceAsset = asset;

    if (!this.isRune(this._selectedSourceAsset)) {
      this.getPoolDetails(this._selectedSourceAsset.chain, this._selectedSourceAsset.symbol, 'source');
    } else if (this._selectedSourceAsset && this.isRune(this._selectedSourceAsset)) {
      this.updateSwapDetails();
    }

    this.sourceBalance = this.userService.findBalance(this.balances, asset);

    if (asset.chain === 'ETH' && asset.ticker !== 'ETH') {
      this.checkContractApproved();
    }

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

    // if (this._selectedTargetAsset && this._selectedTargetAsset.symbol !== this.runeSymbol) {
    if (this._selectedTargetAsset && !this.isRune(this._selectedTargetAsset)) {
      this.getPoolDetails(this._selectedTargetAsset.chain, this._selectedTargetAsset.symbol, 'target');
    } else if (this._selectedTargetAsset && this.isRune(this._selectedTargetAsset)) {
      this.updateSwapDetails();
    }

    this.targetBalance = this.userService.findBalance(this.balances, asset);

  }
  private _selectedTargetAsset: Asset;
  targetPoolDetail: PoolDetail;

  poolDetailMap: {
    [key: string]: PoolDTO
  } = {};
  subs: Subscription[];

  slip: number;
  slippageTolerance: number;
  outboundTransactionFee: number;
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
  selectableMarkets: AssetAndBalance[];

  /**
   * ETH specific
   */
  ethContractApprovalRequired: boolean;
  ethInboundAddress: PoolAddressDTO;

  inboundAddresses: PoolAddressDTO[];
  ethPool: PoolDTO;
  outputNetworkFee: number;

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private midgardService: MidgardService,
    private binanceService: BinanceService,
    private slipLimitService: SlippageToleranceService,
    private thorchainPricesService: ThorchainPricesService,
    private ethUtilsService: EthUtilsService) {

    this.selectedSourceAsset = new Asset('THOR.RUNE');
    this.ethContractApprovalRequired = false;

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {
        this.balances = balances;
        this.sourceBalance = this.userService.findBalance(this.balances, this.selectedSourceAsset);
        this.targetBalance = this.userService.findBalance(this.balances, this.selectedTargetAsset);

        const bnbBalance = this.userService.findBalance(this.balances, new Asset('BNB.BNB'));
        this.insufficientBnb = bnbBalance < 0.000375;

        if (this.selectedTargetAsset && !this.isRune(this.selectedTargetAsset)) {
          this.getPoolDetails(this.selectedTargetAsset.chain, this.selectedTargetAsset.symbol, 'target');
        }

        if (this.selectedSourceAsset && !this.isRune(this.selectedSourceAsset)) {
          this.getPoolDetails(this.selectedSourceAsset.chain, this.selectedSourceAsset.symbol, 'source');
        }

      }
    );

    const user$ = this.userService.user$.subscribe(
      async (user) => {
        this.user = user;
      }
    );

    const slippageTolerange$ = this.slipLimitService.slippageTolerance$.subscribe(
      (limit) => this.slippageTolerance = limit
    );

    this.subs = [balances$, user$, slippageTolerange$];

  }

  ngOnInit(): void {
    this.getConstants();
    this.getBinanceFees();
    this.getPools();
    this.getEthRouter();
    this.getProxiedInboundAddresses();
  }

  isRune(asset: Asset): boolean {
    return asset && asset.ticker === 'RUNE'; // covers BNB and native
  }

  isNativeRune(asset: Asset): boolean {
    return assetToString(asset) === 'THOR.RUNE';
  }

  getEthRouter() {
    this.midgardService.getInboundAddresses().subscribe(
      (addresses) => {
        const ethInbound = addresses.find( (inbound) => inbound.chain === 'ETH' );
        if (ethInbound) {
          this.ethInboundAddress = ethInbound;
        }
      }
    );
  }

  getProxiedInboundAddresses() {
    this.midgardService.getInboundAddresses().subscribe(
      (res) => this.inboundAddresses = res
    );
  }

  getPools() {
    this.midgardService.getPools().subscribe(
      (res) => {

        const ethPool = res.find( (pool) => pool.asset === 'ETH.ETH' );
        if (ethPool) {
          this.ethPool = ethPool;
        }

        const availablePools = res.filter( (pool) => pool.status === 'available' );

        this.selectableMarkets = availablePools
        .sort( (a, b) => a.asset.localeCompare(b.asset) )
        .map((pool) => ({
          asset: new Asset(pool.asset),
          assetPriceUSD: +pool.assetPriceUSD
        }))
        // filter out until we can add support
        .filter( (pool) => pool.asset.chain === 'BNB'
          || pool.asset.chain === 'THOR'
          || pool.asset.chain === 'BTC'
          || pool.asset.chain === 'ETH'
          || pool.asset.chain === 'LTC'
          || pool.asset.chain === 'BCH'
        );

        // Keeping RUNE at top by default
        this.selectableMarkets.unshift({
          asset: new Asset('THOR.RUNE'),
          assetPriceUSD: this.thorchainPricesService.estimateRunePrice(availablePools)
        });

        if (!this.selectedTargetAsset) {
          const btcMarket = this.selectableMarkets.find( (market) => market.asset.chain === 'BTC' && market.asset.symbol === 'BTC' );
          if (btcMarket) {
            this.selectedTargetAsset = btcMarket.asset;
          }
          console.log('no target asset');
        }

      },
      (err) => console.error('error fetching pools:', err)
    );
  }

  async checkContractApproved() {

    if (this.ethInboundAddress && this.user) {
      const assetAddress = this.selectedSourceAsset.symbol.slice(this.selectedSourceAsset.ticker.length + 1);
      const strip0x = assetAddress.substr(2);
      const isApproved = await this.user.clients.ethereum.isApproved(this.ethInboundAddress.router, strip0x, baseAmount(1));
      this.ethContractApprovalRequired = !isApproved;
    }

  }

  contractApproved() {
    this.ethContractApprovalRequired = false;
  }

  formInvalid(): boolean {

    return !this.sourceAssetUnit || !this.selectedSourceAsset || !this.selectedTargetAsset || !this.targetAssetUnit
      || (this.selectedSourceAsset && this.sourceBalance
        && (this.sourceAssetUnit > this.userService.maximumSpendableBalance(this.selectedSourceAsset, this.sourceBalance)))
      || (this.sourceAssetUnit <= this.userService.minimumSpendable(this.selectedSourceAsset))
      || (this.targetAssetUnitDisplay <= this.userService.minimumSpendable(this.selectedTargetAsset))
      || !this.user || !this.balances
      || this.ethContractApprovalRequired
      || (this.slip * 100) > this.slippageTolerance
      || (this.selectedSourceAsset.chain === 'BNB' && this.insufficientBnb); // source is BNB and not enough funds to cover fee
  }

  mainButtonText(): string {

    /** User Not connected */
    if (!this.user || !this.balances) {
      return 'Please connect wallet';
    }

    /** No target asset selected */
    if (!this.selectedTargetAsset) {
      return 'Select a token';
    }

    /** No source amount set */
    if (!this.sourceAssetUnit) {
      return 'Enter an amount';
    }

    /** Source amount is higher than user spendable amount */
    if (this.sourceAssetUnit > this.userService.maximumSpendableBalance(this.selectedSourceAsset, this.sourceBalance)) {
      return 'Insufficient balance';
    }

    /** BNB chain tx and user doesn't have enough BNB  */
    if (this.selectedSourceAsset.chain === 'BNB' && this.insufficientBnb) {
      return 'Insufficient BNB for Fee';
    }

    /** Amount is too low, considered "dusting" */
    if ( (this.sourceAssetUnit <= this.userService.minimumSpendable(this.selectedSourceAsset))
      || (this.targetAssetUnitDisplay <= this.userService.minimumSpendable(this.selectedTargetAsset))) {
        return 'Amount too low';
      }

    /** Exceeds slip tolerance set in user settings */
    if ((this.slip * 100) > this.slippageTolerance) {
      return 'Slip Limit Exceeded';
    }

    /** Good to go */
    if (this.user && this.sourceAssetUnit && this.sourceAssetUnit <= this.sourceBalance && this.selectedTargetAsset) {
      return 'Swap';
    } else {
      console.warn('error creating main button text');
    }

  }

  openConfirmationDialog() {
    const dialogRef = this.dialog.open(
      ConfirmSwapModalComponent,
      {
        minWidth: '260px',
        maxWidth: '420px',
        width: '50vw',
        data: {
          sourceAsset: this.selectedSourceAsset,
          targetAsset: this.selectedTargetAsset,
          outboundTransactionFee: this.outboundTransactionFee,
          bnbFee: this.binanceTransferFeeDisplay,
          basePrice: this.basePrice,
          inputValue: this.sourceAssetUnit,
          outputValue: this.targetAssetUnit.div(10 ** 8),
          user: this.user,
          slip: this.slip
        }
      }
    );

    dialogRef.afterClosed().subscribe( (transactionSuccess: boolean) => {

      if (transactionSuccess) {
        this.targetAssetUnit = null;
        this.sourceAssetUnit = null;
      }

    });
  }

  getPoolDetails(chain: string, symbol: string, type: 'source' | 'target') {

    this.poolDetailTargetError = (type === 'target') ? false : this.poolDetailTargetError;
    this.poolDetailSourceError = (type === 'source') ? false : this.poolDetailSourceError;

    this.midgardService.getPool(`${chain}.${symbol}`).subscribe(
      (res) => {
        if (res) {
          this.poolDetailMap[`${chain}.${symbol}`] = res;
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
        this.outboundTransactionFee = bn(res.int_64_values.OutboundTransactionFee).div(10 ** 8).toNumber();
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

      // const swapType = this.selectedSourceAsset.symbol === this.runeSymbol || this.selectedTargetAsset.symbol === this.runeSymbol
      const swapType = this.isRune(this.selectedSourceAsset) || this.isRune(this.selectedTargetAsset)
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

        this.sourceAssetUnit = (targetBalance < targetInput.div(10 ** 8).toNumber()) // if target balance is less than target input
          ? max // use balance
          : targetInput.div(10 ** 8 ).toNumber(); // otherwise use input value
      } else {
        this.sourceAssetUnit = (targetInput) ? targetInput.div(10 ** 8).toNumber() : 0;
      }

    }

  }

  /**
   * When RUNE is one of the assets being exchanged
   * For example RUNE <==> DAI
   */
  calculateSingleSwap() {

    const toRune = this.isRune(this.selectedTargetAsset)
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

      /** Network Fee */
      // const networkFee = this.calculateNetworkFee(this.selectedTargetAsset, poolDetail);
      this.outputNetworkFee = this.calculateNetworkFee(
        (toRune)
          ? this.selectedSourceAsset
          : this.selectedTargetAsset,
        poolDetail
      );
      console.log('network fee is: ', this.outputNetworkFee);

      /**
       * Total output amount in target units minus 1 RUNE
       */
      // const totalAmount = getSwapOutput(baseAmount(this._sourceAssetTokenValue.amount()), pool, toRune);
      const totalAmount = getSwapOutput(baseAmount(this._sourceAssetTokenValue.amount()
        .minus( // subtract RUNE network fee
          toRune
            ? valueOfRuneInAsset.amount().multipliedBy(this.outboundTransactionFee ?? 0.2)
            : assetToBase(assetAmount(this.outboundTransactionFee ?? 0.2)).amount()
          ).minus(
            assetToBase(assetAmount(this.outputNetworkFee)).amount())
        ), pool, toRune);

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

    if (sourcePool && targetPool) {
      const pool1: PoolData = {
        assetBalance: baseAmount(sourcePool.assetDepth),
        runeBalance: baseAmount(sourcePool.runeDepth),
      };
      const pool2: PoolData = {
        assetBalance: baseAmount(targetPool.assetDepth),
        runeBalance: baseAmount(targetPool.runeDepth),
      };

      const basePrice = getDoubleSwapOutput(assetToBase(assetAmount(1)), pool2, pool1);
      this.basePrice = basePrice.amount().div(10 ** 8).toNumber();

      const slip = getDoubleSwapSlip(this._sourceAssetTokenValue, pool1, pool2);
      this.slip = slip.toNumber();

      const valueOfRuneInAsset = getValueOfRuneInAsset(assetToBase(assetAmount(this.outboundTransactionFee ?? 0.2)), pool1);

      const total = getDoubleSwapOutput(baseAmount(this._sourceAssetTokenValue.amount()
      .minus( // subtract RUNE network fee
        valueOfRuneInAsset.amount().multipliedBy(this.outboundTransactionFee ?? 0.2)
        )
      ), pool1, pool2);

      if (this.sourceAssetUnit) {
        this.targetAssetUnit = (total.amount().isLessThan(0)) ? bn(0) : total.amount();
      } else {
        this.targetAssetUnit = null;
      }

    }

    this.calculatingTargetAsset = false;

  }

  calculateNetworkFee(asset: Asset, assetPool: PoolDTO): number {

    const matchingInboundAddress = this.inboundAddresses.find( (pool) => pool.chain === asset.chain );

    if (matchingInboundAddress) {
      switch (asset.chain) {
        case 'BTC':
        case 'LTC':
        case 'BCH':
          return (250 * (+matchingInboundAddress.gas_rate) * 3) / 10 ** 8;

        case 'ETH':

          // ETH
          if (asset.symbol === 'ETH') {
            return (35000 * (+matchingInboundAddress.gas_rate) * (10**9) * 3)  / 10**18;
          }
          // ERC20
          else {
            // example...
            // ethGasVal = 0.2 ETH
            // 1 USDT = 0.1 ETH
            // 2 USDT to cover gas
            const ethGasVal = (70000 * (+matchingInboundAddress.gas_rate) * (10**9) * 3)  / 10**18;
            console.log('gas rate is: ', matchingInboundAddress.gas_rate);
            console.log('eth gas value is: ', ethGasVal);
            const tokenEthValue = (+assetPool.assetPriceUSD) / (+this.ethPool.assetPriceUSD);
            // const tokenEthValue = this.ethUtilsService.getErc20ValueInEth(this.ethPool, assetPool);
            console.log('token eth value is: ', tokenEthValue);
            return ethGasVal / tokenEthValue;
          }

        case 'BNB':
          return 0.000375;

        case 'THOR':
          return this.outboundTransactionFee ?? 0.2;
      }
      console.error('calculateNetworkFee no chain match');
    }
    console.error('calculateNetworkFee no matching inbound address found');
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
