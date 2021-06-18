import { Component, OnInit, OnDestroy } from '@angular/core';
import { Asset, getChainAsset } from '../_classes/asset';
import { UserService } from '../_services/user.service';
import { combineLatest, Subscription, timer } from 'rxjs';
import {
  getDoubleSwapOutput,
  getSwapSlip,
  getDoubleSwapSlip,
  PoolData,
  getValueOfAssetInRune,
  getValueOfRuneInAsset,
  getSwapOutput,
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
import { MidgardService, ThorchainQueue } from '../_services/midgard.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmSwapModalComponent } from './confirm-swap-modal/confirm-swap-modal.component';
import { User } from '../_classes/user';
import { Balances } from '@xchainjs/xchain-client';
import { AssetAndBalance } from '../_classes/asset-and-balance';
import { PoolDTO } from '../_classes/pool';
import { SlippageToleranceService } from '../_services/slippage-tolerance.service';
import { PoolAddressDTO } from '../_classes/pool-address';
import { ThorchainPricesService } from '../_services/thorchain-prices.service';
import { TransactionUtilsService } from '../_services/transaction-utils.service';
import { NetworkQueueService } from '../_services/network-queue.service';
import {
  debounceTime,
  delay,
  retryWhen,
  switchMap,
  take,
} from 'rxjs/operators';
import { UpdateTargetAddressModalComponent } from './update-target-address-modal/update-target-address-modal.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MetamaskService } from '../_services/metamask.service';
import { ethers } from 'ethers';
import { EthUtilsService } from '../_services/eth-utils.service';
import { MockClientService } from '../_services/mock-client.service';

export enum SwapType {
  DOUBLE_SWAP = 'double_swap',
  SINGLE_SWAP = 'single_swap',
}

@Component({
  selector: 'app-swap',
  templateUrl: './swap.component.html',
  styleUrls: ['./swap.component.scss'],
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
    const path = this.selectedTargetAsset
      ? [
          '/',
          'swap',
          assetToString(asset),
          assetToString(this.selectedTargetAsset),
        ]
      : ['/', 'swap', assetToString(asset)];

    this.router.navigate(path);
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
    this.targetAssetUnitDisplay = val
      ? Number(val.div(10 ** 8).toPrecision())
      : null;
  }
  private _targetAssetUnit: BigNumber;

  targetAssetUnitDisplay: number;

  get selectedTargetAsset() {
    return this._selectedTargetAsset;
  }
  set selectedTargetAsset(asset: Asset) {
    const path = [
      '/',
      'swap',
      assetToString(this.selectedSourceAsset),
      assetToString(asset),
    ];

    this.router.navigate(path);
  }
  private _selectedTargetAsset: Asset;
  targetPoolDetail: PoolDetail;
  subs: Subscription[];

  slip: number;
  slippageTolerance: number;
  user: User;
  basePrice: number;

  balances: Balances;
  sourceBalance: number;
  targetBalance: number;

  calculatingTargetAsset: boolean;
  poolDetailTargetError: boolean;
  poolDetailSourceError: boolean;
  selectableSourceMarkets: AssetAndBalance[] = [];
  selectableTargetMarkets: AssetAndBalance[] = [];

  inboundFees: { [key: string]: number } = {};

  outboundFees: { [key: string]: number } = {};
  targetAddress: string;

  /**
   * ETH specific
   */
  ethContractApprovalRequired: boolean;
  ethInboundAddress: PoolAddressDTO;
  availablePools: PoolDTO[];

  inboundAddresses: PoolAddressDTO[];
  ethPool: PoolDTO;
  inputNetworkFee: number;
  outputNetworkFee: number;
  queue: ThorchainQueue;

  networkFeeInSource: number;
  sourceChainBalance: number;

  haltedChains: string[];
  metaMaskProvider?: ethers.providers.Web3Provider;

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private midgardService: MidgardService,
    private slipLimitService: SlippageToleranceService,
    private thorchainPricesService: ThorchainPricesService,
    private txUtilsService: TransactionUtilsService,
    private networkQueueService: NetworkQueueService,
    private router: Router,
    private route: ActivatedRoute,
    private metaMaskService: MetamaskService,
    private ethUtilService: EthUtilsService,
    private mockClientService: MockClientService
  ) {
    this.ethContractApprovalRequired = false;
    this.haltedChains = [];
    this.targetAddress = '';

    const balances$ = this.userService.userBalances$
      .pipe(debounceTime(500))
      .subscribe((balances) => {
        this.balances = balances;
        this.sourceBalance = this.userService.findBalance(
          this.balances,
          this.selectedSourceAsset
        );
        this.targetBalance = this.userService.findBalance(
          this.balances,
          this.selectedTargetAsset
        );

        if (
          this.selectedTargetAsset &&
          !this.isRune(this.selectedTargetAsset)
        ) {
          this.updateSwapDetails();
        }

        if (this.selectedSourceAsset) {
          this.setSourceChainBalance();

          if (!this.isRune(this.selectedSourceAsset)) {
            this.updateSwapDetails();
          }
        }
      });

    const user$ = this.userService.user$.subscribe(async (user) => {
      this.user = user;
      this.setTargetAddress();
      if (this.user && this.user.type === 'metamask') {
        this.router.navigate(['/', 'swap', 'ETH.ETH', 'BTC.BTC']);
      }

      if (
        this.selectedSourceAsset &&
        this.selectedSourceAsset.chain === 'ETH' &&
        this.selectedSourceAsset.ticker !== 'ETH'
      ) {
        this.checkContractApproved();
      }
    });

    const metaMaskProvider$ = this.metaMaskService.provider$.subscribe(
      (provider) => (this.metaMaskProvider = provider)
    );

    const queue$ = this.networkQueueService.networkQueue$.subscribe(
      (queue) => (this.queue = queue)
    );

    const slippageTolerange$ =
      this.slipLimitService.slippageTolerance$.subscribe(
        (limit) => (this.slippageTolerance = limit)
      );

    this.subs = [
      balances$,
      user$,
      slippageTolerange$,
      queue$,
      metaMaskProvider$,
    ];
  }

  ngOnInit(): void {
    this.getEthRouter();

    const inboundAddresses$ = this.midgardService.getInboundAddresses();
    const pools$ = this.midgardService.getPools();
    const params$ = this.route.paramMap;
    const combined = combineLatest([inboundAddresses$, pools$, params$]);
    const sub = timer(0, 30000)
      .pipe(
        switchMap(() => combined),
        retryWhen((errors) => errors.pipe(delay(10000), take(10)))
      )
      .subscribe(([inboundAddresses, pools, params]) => {
        this.inboundAddresses = inboundAddresses;

        // check for halted chains
        this.setHaltedChains();

        // set ETH pool if available
        const ethPool = pools.find((pool) => pool.asset === 'ETH.ETH');
        if (ethPool) {
          this.ethPool = ethPool;
        }

        this.setAvailablePools(pools);
        this.setSelectableMarkets();

        // update network fees
        this.setNetworkFees();

        const inputAsset = params.get('inputAsset');

        if (
          !this.selectedSourceAsset || // no input asset
          (this.selectedSourceAsset && // or asset
            assetToString(this.selectedSourceAsset) !== inputAsset) // does not match input param
        ) {
          this.setSelectedSourceAsset(
            new Asset(inputAsset),
            this.selectableSourceMarkets
          );
        }

        const outputAsset = params.get('outputAsset');
        if (
          outputAsset &&
          outputAsset.length > 0 &&
          outputAsset != inputAsset
        ) {
          this.setSelectedTargetAsset(
            new Asset(outputAsset),
            this.selectableTargetMarkets
          );
        }
      });

    this.subs.push(sub);
  }

  setSelectedSourceAsset(asset: Asset, selectableMarkets: AssetAndBalance[]) {
    // ensure match exists
    const match = selectableMarkets.find(
      (market) => assetToString(market.asset) === assetToString(asset)
    );

    if (match) {
      this.ethContractApprovalRequired = false;
      if (this.selectedSourceAsset) {
        this.targetAssetUnit = null;
        this.calculatingTargetAsset = true;
      }
      this._selectedSourceAsset = asset;
      this.updateSwapDetails();
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

      this.setSourceChainBalance();
    }
  }

  setSelectedTargetAsset(asset: Asset, selectableMarkets: AssetAndBalance[]) {
    // ensure match exists
    const match = selectableMarkets.find(
      (market) => assetToString(market.asset) === assetToString(asset)
    );
    if (match) {
      this._selectedTargetAsset = asset;
      this.targetAssetUnit = null;
      this.calculatingTargetAsset = true;
      this.updateSwapDetails();
      this.targetBalance = this.userService.findBalance(this.balances, asset);
      this.setTargetAddress();
    }
  }

  setTargetAddress() {
    if (!this.targetAddress || this.targetAddress?.length <= 0) {
      if (this.selectedTargetAsset && this.user) {
        this.targetAddress = this.userService.getTokenAddress(
          this.user,
          this.selectedTargetAsset.chain
        );
      } else {
        this.targetAddress = '';
      }
    } else {
      this.targetAddress = this.mockClientService
        .getMockClientByChain(this.selectedTargetAsset.chain)
        .validateAddress(this.targetAddress)
        ? this.targetAddress
        : '';
    }
  }

  setSourceChainBalance() {
    if (this.selectedSourceAsset && this.balances) {
      const sourceChainAsset = getChainAsset(this.selectedSourceAsset?.chain);
      const sourceChainBalance = this.userService.findBalance(
        this.balances,
        sourceChainAsset
      );
      this.sourceChainBalance = sourceChainBalance ?? 0;
    } else {
      this.sourceChainBalance = 0;
    }
  }

  launchEditTargetAddressModal() {
    if (!this.selectedTargetAsset || !this.user) {
      return;
    }

    const dialogRef = this.dialog.open(UpdateTargetAddressModalComponent, {
      minWidth: '260px',
      maxWidth: '420px',
      width: '50vw',
      data: {
        chain: this.selectedTargetAsset.chain,
        targetAddress: this.targetAddress,
        user: this.user,
      },
    });

    dialogRef.afterClosed().subscribe((newAddress: string) => {
      if (newAddress && newAddress.length > 0) {
        this.targetAddress = newAddress;
      }
    });
  }

  setNetworkFees() {
    if (!this.availablePools || !this.inboundAddresses) {
      return;
    }

    for (const pool of this.availablePools) {
      const asset = new Asset(pool.asset);

      const assetOutboundFee = this.txUtilsService.calculateNetworkFee(
        asset,
        this.inboundAddresses,
        'OUTBOUND',
        pool
      );

      const assetInboundFee = this.txUtilsService.calculateNetworkFee(
        asset,
        this.inboundAddresses,
        'INBOUND',
        pool
      );

      this.outboundFees[pool.asset] = assetOutboundFee;
      this.inboundFees[pool.asset] = assetInboundFee;
    }

    // set THOR.RUNE network fees
    this.outboundFees['THOR.RUNE'] = this.txUtilsService.calculateNetworkFee(
      new Asset('THOR.RUNE'),
      this.inboundAddresses,
      'OUTBOUND'
    );

    this.inboundFees['THOR.RUNE'] = this.txUtilsService.calculateNetworkFee(
      new Asset('THOR.RUNE'),
      this.inboundAddresses,
      'INBOUND'
    );
  }

  isRune(asset: Asset): boolean {
    return asset && asset.ticker === 'RUNE'; // covers BNB and native
  }

  isNativeRune(asset: Asset): boolean {
    return assetToString(asset) === 'THOR.RUNE';
  }

  getEthRouter() {
    this.midgardService.getInboundAddresses().subscribe((addresses) => {
      const ethInbound = addresses.find((inbound) => inbound.chain === 'ETH');
      if (ethInbound) {
        this.ethInboundAddress = ethInbound;
      }
    });
  }

  setHaltedChains() {
    this.haltedChains = this.inboundAddresses
      .filter((inboundAddress) => inboundAddress.halted)
      .map((inboundAddress) => inboundAddress.chain);
  }

  setAvailablePools(pools: PoolDTO[]) {
    this.availablePools = pools
      .filter((pool) => pool.status === 'available')
      .filter(
        (pool) => !this.haltedChains.includes(new Asset(pool.asset).chain)
      );
  }

  setSelectableMarkets() {
    if (!this.availablePools) {
      this.selectableSourceMarkets = [];
      this.selectableTargetMarkets = [];
    } else {
      const availablePools = this.availablePools
        .sort((a, b) => a.asset.localeCompare(b.asset))
        .map((pool) => ({
          asset: new Asset(pool.asset),
          assetPriceUSD: +pool.assetPriceUSD,
        }));

      this.selectableSourceMarkets =
        this.userService.filterAvailableSourceChains({
          userType: this.user?.type,
          assets: availablePools,
        });

      this.selectableTargetMarkets = availablePools;
      const runeMarket = {
        asset: new Asset('THOR.RUNE'),
        assetPriceUSD: this.thorchainPricesService.estimateRunePrice(
          this.availablePools
        ),
      };

      this.selectableTargetMarkets.unshift(runeMarket);

      if (
        this.user?.type === 'XDEFI' ||
        this.user?.type === 'keystore' ||
        !this.user
      ) {
        // Keeping RUNE at top by default
        this.selectableSourceMarkets.unshift(runeMarket);
      }
    }
  }

  async checkContractApproved() {
    if (this.ethInboundAddress && this.user) {
      const assetAddress = this.selectedSourceAsset.symbol.slice(
        this.selectedSourceAsset.ticker.length + 1
      );
      const strip0x = assetAddress.substr(2);
      const provider =
        this.user.type === 'keystore' || this.user.type === 'XDEFI'
          ? this.user.clients.ethereum.getProvider()
          : this.metaMaskProvider;
      const userAddress =
        this.user.type === 'keystore' || this.user.type === 'XDEFI'
          ? this.user.clients.ethereum.getAddress()
          : await this.metaMaskProvider.getSigner().getAddress();

      const isApproved = await this.ethUtilService.isApproved(
        provider,
        strip0x,
        this.ethInboundAddress.router,
        userAddress
      );
      this.ethContractApprovalRequired = !isApproved;
    }
  }

  contractApproved() {
    this.ethContractApprovalRequired = false;
  }

  formInvalid(): boolean {
    return (
      !this.sourceAssetUnit ||
      !this.selectedSourceAsset ||
      !this.selectedTargetAsset ||
      !this.targetAssetUnit ||
      !this.inboundAddresses ||
      this.haltedChains.includes(this.selectedSourceAsset.chain) ||
      this.haltedChains.includes(this.selectedTargetAsset?.chain) ||
      this.sourceAssetUnit >
        this.userService.maximumSpendableBalance(
          this.selectedSourceAsset,
          this.sourceBalance,
          this.inboundAddresses
        ) ||
      this.sourceAssetUnit <=
        this.userService.minimumSpendable(this.selectedSourceAsset) ||
      this.targetAssetUnitDisplay <=
        this.userService.minimumSpendable(this.selectedTargetAsset) ||
      !this.user ||
      !this.balances ||
      this.ethContractApprovalRequired ||
      (this.queue && this.queue.outbound >= 12) ||
      this.slip * 100 > this.slippageTolerance ||
      // check target asset amount is greater than outbound network fee * 3
      this.targetAssetUnitDisplay <
        this.outboundFees[assetToString(this.selectedTargetAsset)] ||
      // if RUNE, ensure 3 RUNE remain in wallet
      (this.selectedSourceAsset.chain === 'THOR' &&
        this.sourceBalance - this.sourceAssetUnit < 3) ||
      // check sufficient underlying chain balance to cover fees
      this.sourceChainBalance <
        1.5 *
          this.inboundFees[
            assetToString(getChainAsset(this.selectedSourceAsset.chain))
          ] ||
      !this.mockClientService
        .getMockClientByChain(this.selectedTargetAsset.chain)
        .validateAddress(this.targetAddress)
    );
  }

  mainButtonText(): string {
    /** User Not connected */
    if (!this.user || !this.balances) {
      return 'Please connect wallet';
    }

    /** THORChain is backed up */
    if (this.queue && this.queue.outbound >= 12) {
      return 'THORChain Network Latency';
    }

    /** No target asset selected */
    if (!this.selectedSourceAsset) {
      return 'Select token';
    }

    if (this.haltedChains.includes(this.selectedSourceAsset.chain)) {
      return `${this.selectedSourceAsset.chain} Halted`;
    }

    /** No target asset selected */
    if (!this.selectedTargetAsset) {
      return 'Select token';
    }

    if (this.haltedChains.includes(this.selectedTargetAsset.chain)) {
      return `${this.selectedTargetAsset.chain} Halted`;
    }

    if (
      this.selectedSourceAsset.chain === 'THOR' &&
      this.sourceBalance - this.sourceAssetUnit < 3
    ) {
      return 'Min 3 RUNE in Wallet Required';
    }

    /** No source amount set */
    if (!this.sourceAssetUnit) {
      return 'Enter an amount';
    }

    /** Input Amount is less than network fees */
    if (
      this.sourceChainBalance <
      1.05 *
        this.inboundFees[
          assetToString(getChainAsset(this.selectedSourceAsset.chain))
        ]
    ) {
      return `Insufficient ${this.selectedSourceAsset.chain}`;
    }

    /** Output Amount is less than network fees */
    if (
      this.targetAssetUnitDisplay <
      this.outboundFees[assetToString(this.selectedTargetAsset)]
    ) {
      return 'Output Amount Less Than Fees';
    }

    if (!this.inboundAddresses) {
      return 'Loading';
    }

    /** Source amount is higher than user spendable amount */
    if (
      this.sourceAssetUnit >
      this.userService.maximumSpendableBalance(
        this.selectedSourceAsset,
        this.sourceBalance,
        this.inboundAddresses
      )
    ) {
      return 'Insufficient balance';
    }

    /** Amount is too low, considered "dusting" */
    if (
      this.sourceAssetUnit <=
        this.userService.minimumSpendable(this.selectedSourceAsset) ||
      this.targetAssetUnitDisplay <=
        this.userService.minimumSpendable(this.selectedTargetAsset)
    ) {
      return 'Amount too low';
    }

    /** Exceeds slip tolerance set in user settings */
    if (this.slip * 100 > this.slippageTolerance) {
      return 'Slip Limit Exceeded';
    }

    /** Validate Address */
    if (
      !this.mockClientService
        .getMockClientByChain(this.selectedTargetAsset.chain)
        .validateAddress(this.targetAddress)
    ) {
      return 'Enter Valid Address';
    }

    /** Good to go */
    if (
      this.user &&
      this.sourceAssetUnit &&
      this.sourceAssetUnit <= this.sourceBalance &&
      this.selectedTargetAsset
    ) {
      return 'Swap';
    } else {
      console.warn('error creating main button text');
    }
  }

  openConfirmationDialog() {
    const dialogRef = this.dialog.open(ConfirmSwapModalComponent, {
      minWidth: '260px',
      maxWidth: '420px',
      width: '50vw',
      data: {
        sourceAsset: this.selectedSourceAsset,
        targetAsset: this.selectedTargetAsset,
        basePrice: this.basePrice,
        inputValue: this.sourceAssetUnit,
        outputValue: this.targetAssetUnit.div(10 ** 8),
        user: this.user,
        slip: this.slip,
        networkFeeInSource: this.networkFeeInSource,
        targetAddress: this.targetAddress,
      },
    });

    dialogRef.afterClosed().subscribe((transactionSuccess: boolean) => {
      if (transactionSuccess) {
        this.targetAssetUnit = null;
        this.sourceAssetUnit = null;
      }
    });
  }

  updateSwapDetails() {
    if (this.selectedSourceAsset && this.selectedTargetAsset) {
      this.calculateTargetUnits();
    } else {
      this.calculatingTargetAsset = false;
    }
  }

  async calculateTargetUnits() {
    if (
      this._sourceAssetTokenValue &&
      this.availablePools &&
      this.availablePools.length > 0
    ) {
      const swapType =
        this.isRune(this.selectedSourceAsset) ||
        this.isRune(this.selectedTargetAsset)
          ? SwapType.SINGLE_SWAP
          : SwapType.DOUBLE_SWAP;

      if (swapType === SwapType.SINGLE_SWAP) {
        this.calculateSingleSwap();
      } else if (
        swapType === SwapType.DOUBLE_SWAP &&
        this.availablePools.find(
          (pool) => pool.asset === assetToString(this.selectedTargetAsset)
        ) &&
        this.availablePools.find(
          (pool) => pool.asset === assetToString(this.selectedSourceAsset)
        )
      ) {
        this.calculateDoubleSwap();
      }
    } else {
      this.calculatingTargetAsset = false;
    }
  }

  reverseTransaction() {
    if (this.selectedSourceAsset && this.selectedTargetAsset) {
      this.router.navigate([
        '/',
        'swap',
        assetToString(this.selectedTargetAsset),
        assetToString(this.selectedSourceAsset),
      ]);
    }
  }

  reverseTransactionDisabled(): boolean {
    return (
      !this.selectedSourceAsset ||
      !this.selectedTargetAsset ||
      (this.user?.type === 'metamask' &&
        this.selectedTargetAsset?.chain !== 'ETH')
    );
  }

  /**
   * When RUNE is one of the assets being exchanged
   * For example RUNE <==> DAI
   */
  calculateSingleSwap() {
    const toRune = this.isRune(this.selectedTargetAsset) ? true : false;

    const poolDetail = toRune
      ? this.availablePools.find(
          (pool) => pool.asset === assetToString(this.selectedSourceAsset)
        )
      : this.availablePools.find(
          (pool) => pool.asset === assetToString(this.selectedTargetAsset)
        );

    if (poolDetail) {
      const pool: PoolData = {
        assetBalance: baseAmount(poolDetail.assetDepth),
        runeBalance: baseAmount(poolDetail.runeDepth),
      };

      /**
       * TO SHOW BASE PRICE
       */

      const valueOfRuneInAsset = getValueOfRuneInAsset(
        assetToBase(assetAmount(1)),
        pool
      );
      const valueOfAssetInRune = getValueOfAssetInRune(
        assetToBase(assetAmount(1)),
        pool
      );

      const basePrice = toRune ? valueOfRuneInAsset : valueOfAssetInRune;
      this.basePrice = basePrice
        .amount()
        .div(10 ** 8)
        .toNumber();

      /**
       * Slip percentage using original input
       */
      const slip = getSwapSlip(this._sourceAssetTokenValue, pool, toRune);
      this.slip = slip.toNumber();

      const inboundFee =
        this.inboundFees[assetToString(this.selectedSourceAsset)];
      const outboundFee =
        this.outboundFees[assetToString(this.selectedTargetAsset)];
      const outboundFeeInSourceVal = this.basePrice * outboundFee;

      this.networkFeeInSource = inboundFee + outboundFeeInSourceVal;

      /**
       * Total output amount in target units minus 1 RUNE
       */
      const swapOutput = getSwapOutput(
        baseAmount(
          this._sourceAssetTokenValue
            .amount()
            .minus(assetToBase(assetAmount(inboundFee)).amount())
        ),
        pool,
        toRune
      );

      // sub
      const totalAmount = baseAmount(
        swapOutput
          .amount()
          .minus(assetToBase(assetAmount(outboundFee)).amount())
      );

      if (this.sourceAssetUnit) {
        this.targetAssetUnit = totalAmount.amount().isLessThan(0)
          ? bn(0)
          : totalAmount.amount();
      } else {
        this.targetAssetUnit = this.sourceAssetUnit
          ? totalAmount.amount().isLessThan(0)
            ? bn(0)
            : totalAmount.amount()
          : null;
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
    const sourcePool = this.availablePools.find(
      (pool) => pool.asset === assetToString(this.selectedSourceAsset)
    );
    const targetPool = this.availablePools.find(
      (pool) => pool.asset === assetToString(this.selectedTargetAsset)
    );

    if (sourcePool && targetPool) {
      const pool1: PoolData = {
        assetBalance: baseAmount(sourcePool.assetDepth),
        runeBalance: baseAmount(sourcePool.runeDepth),
      };
      const pool2: PoolData = {
        assetBalance: baseAmount(targetPool.assetDepth),
        runeBalance: baseAmount(targetPool.runeDepth),
      };

      this.inputNetworkFee = this.txUtilsService.calculateNetworkFee(
        this.selectedSourceAsset,
        this.inboundAddresses,
        'INBOUND',
        sourcePool
      );
      this.outputNetworkFee = this.txUtilsService.calculateNetworkFee(
        this.selectedTargetAsset,
        this.inboundAddresses,
        'OUTBOUND',
        targetPool
      );

      const basePrice = getDoubleSwapOutput(
        assetToBase(assetAmount(1)),
        pool2,
        pool1
      );
      this.basePrice = basePrice
        .amount()
        .div(10 ** 8)
        .toNumber();

      const outboundFeeInSourceVal = this.basePrice * this.outputNetworkFee;
      this.networkFeeInSource = this.inputNetworkFee + outboundFeeInSourceVal;

      const slip = getDoubleSwapSlip(this._sourceAssetTokenValue, pool1, pool2);
      this.slip = slip.toNumber();

      const total = getDoubleSwapOutput(
        baseAmount(
          this._sourceAssetTokenValue
            .amount()
            .minus(assetToBase(assetAmount(this.inputNetworkFee)).amount())
        ),
        pool1,
        pool2
      )
        .amount()
        .minus(assetToBase(assetAmount(this.outputNetworkFee)).amount());

      if (this.sourceAssetUnit) {
        this.targetAssetUnit = total.isLessThan(0) ? bn(0) : total;
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
