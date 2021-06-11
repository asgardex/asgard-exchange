import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  getValueOfAssetInRune,
  getValueOfRuneInAsset,
  PoolData,
} from '@thorchain/asgardex-util';
import {
  baseAmount,
  assetToBase,
  assetAmount,
  assetToString,
} from '@xchainjs/xchain-util';
import { combineLatest, Subscription } from 'rxjs';
import { Asset, getChainAsset, isNonNativeRuneToken } from '../_classes/asset';
import { MidgardService } from '../_services/midgard.service';
import { UserService } from '../_services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDepositModalComponent } from './confirm-deposit-modal/confirm-deposit-modal.component';
import { User } from '../_classes/user';
import { Balances } from '@xchainjs/xchain-client';
import { AssetAndBalance } from '../_classes/asset-and-balance';
import { TransactionUtilsService } from '../_services/transaction-utils.service';
import { debounceTime } from 'rxjs/operators';
import { PoolAddressDTO } from '../_classes/pool-address';
import { toLegacyAddress } from '@xchainjs/xchain-bitcoincash';
import {
  AvailablePoolTypeOptions,
  PoolTypeOption,
} from '../_const/pool-type-options';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss'],
})
export class DepositComponent implements OnInit, OnDestroy {
  /**
   * Rune
   */
  rune: Asset;
  runeAmount: number;

  /**
   * Asset
   */
  set asset(val: Asset) {
    if (val) {
      if (!this._asset) {
        this._asset = val;
      } else {
        if (val.symbol !== this._asset.symbol) {
          this.router.navigate(['/', 'deposit', `${val.chain}.${val.symbol}`]);
          this._asset = val;
          this.assetBalance = this.userService.findBalance(
            this.balances,
            this.asset
          );
        }
      }
    }
  }
  get asset() {
    return this._asset;
  }
  _asset: Asset;
  assetAmount: number;
  assetPoolData: PoolData;

  /**
   * Balances
   */
  balances: Balances;
  runeBalance: number;
  assetBalance: number;

  user: User;
  subs: Subscription[];
  selectableMarkets: AssetAndBalance[];

  ethRouter: string;
  ethContractApprovalRequired: boolean;

  poolNotFoundErr: boolean;

  runeFee: number;
  networkFee: number;
  chainNetworkFee: number;
  depositsDisabled: boolean;
  sourceChainBalance: number;
  inboundAddresses: PoolAddressDTO[];

  haltedChains: string[];
  isHalted: boolean;

  bchLegacyPooled: boolean;
  loading: boolean;
  poolType: PoolTypeOption;
  poolTypeOptions: AvailablePoolTypeOptions = {
    asymAsset: true,
    asymRune: true,
    sym: true,
  };
  formValidation: {
    message: string;
    isValid: boolean;
  };

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private midgardService: MidgardService,
    private txUtilsService: TransactionUtilsService
  ) {
    this.poolNotFoundErr = false;
    this.ethContractApprovalRequired = false;
    this.rune = new Asset('THOR.RUNE');
    this.subs = [];
    this.depositsDisabled = false;
    this.haltedChains = [];
    this.isHalted = false;
    this.bchLegacyPooled = false;
    this.poolType = 'SYM';
    this.formValidation = {
      message: '',
      isValid: false,
    };
  }

  ngOnInit(): void {
    const params$ = this.route.paramMap;
    const balances$ = this.userService.userBalances$;
    const user$ = this.userService.user$.pipe(debounceTime(500));
    const inboundAddresses$ = this.midgardService.getInboundAddresses();

    const combinedUser = combineLatest([user$, balances$]);

    const combinedPoolData = combineLatest([inboundAddresses$, params$]);

    const combinedPoolSub = combinedPoolData.subscribe(
      ([inboundAddresses, params]) => {
        // Inbound Addresses
        this.inboundAddresses = inboundAddresses;
        this.haltedChains = this.inboundAddresses
          .filter((address) => address.halted)
          .map((address) => address.chain);

        const asset = params.get('asset');
        this.assetAmount = null;
        this.runeAmount = null;
        this.ethContractApprovalRequired = false;

        if (asset) {
          this.asset = new Asset(asset);

          if (
            this.asset &&
            this.asset.chain === 'ETH' &&
            this.asset.ticker !== 'ETH'
          ) {
            this.checkContractApproved(this.asset);
          }

          if (asset === 'BCH.BCH') {
            this.checkLegacyBch();
          }

          this.isHalted = this.haltedChains.includes(this.asset.chain);

          this.setSourceChainBalance();

          if (isNonNativeRuneToken(this.asset)) {
            this.back();
            return;
          }

          this.getPoolDetail(asset);
          this.assetBalance = this.userService.findBalance(
            this.balances,
            this.asset
          );

          if (this.asset.chain === 'ETH' && this.asset.ticker !== 'ETH') {
            this.checkContractApproved(this.asset);
          }
        }

        this.validate();
      }
    );

    const userSub = combinedUser.subscribe(([user, balances]) => {
      // User
      this.user = user;

      // Balance
      this.balances = balances;
      this.runeBalance = this.userService.findBalance(this.balances, this.rune);
      this.assetBalance = this.userService.findBalance(
        this.balances,
        this.asset
      );

      this.setSourceChainBalance();

      if (
        this.asset &&
        this.asset.chain === 'ETH' &&
        this.asset.ticker !== 'ETH'
      ) {
        this.checkContractApproved(this.asset);
      }

      this.validate();
    });

    this.getPools();
    this.getEthRouter();
    this.getPoolCap();
    this.subs.push(userSub, combinedPoolSub);
  }

  /**
   * This prevents user from depositing BCH with their Cash Address
   * if they have a current deposit/pending deposit with a Legacy Address
   * This prevents users from going through with a new deposit, potentially losing funds.
   */
  async checkLegacyBch() {
    if (!this.user) {
      return;
    }

    const client = this.user.clients?.bitcoinCash;
    if (!client) {
      return;
    }

    const cashAddress = client.getAddress();
    const legacyAddress = toLegacyAddress(cashAddress);
    console.log('legacy address is: ', legacyAddress);
    const bchLps = await this.midgardService
      .getThorchainLiquidityProviders('BCH.BCH')
      .toPromise();

    const match = bchLps.find((lp) => lp.asset_address === legacyAddress);
    if (match) {
      this.bchLegacyPooled = true;
    }
  }

  setPoolTypeOption(option: PoolTypeOption) {
    this.poolType = option;
    this.validate();
  }

  updateValues(source: 'ASSET' | 'RUNE', amount?: number) {
    if (source === 'ASSET') {
      this.assetAmount = amount ?? null;
      if (amount) {
        this.updateRuneAmount();
      } else {
        this.runeAmount = null;
      }
    } else {
      this.runeAmount = amount ?? null;
      if (amount) {
        this.updateAssetAmount();
      } else {
        this.assetAmount = null;
      }
    }

    this.validate();
  }

  setSourceChainBalance() {
    if (this.asset && this.balances) {
      const sourceChainAsset = getChainAsset(this.asset.chain);
      const sourceChainBalance = this.userService.findBalance(
        this.balances,
        sourceChainAsset
      );
      this.sourceChainBalance = sourceChainBalance ?? 0;
    } else {
      this.sourceChainBalance = 0;
    }
  }

  getPoolCap() {
    const mimir$ = this.midgardService.getMimir();
    const network$ = this.midgardService.getNetwork();
    const combined = combineLatest([mimir$, network$]);
    const sub = combined.subscribe(([mimir, network]) => {
      // prettier-ignore
      const totalPooledRune = +network.totalPooledRune / (10 ** 8);

      if (mimir && mimir['mimir//MAXIMUMLIQUIDITYRUNE']) {
        // prettier-ignore
        const maxLiquidityRune = mimir['mimir//MAXIMUMLIQUIDITYRUNE'] / (10 ** 8);
        this.depositsDisabled = totalPooledRune / maxLiquidityRune >= 0.9;
      }
    });

    this.subs.push(sub);
  }

  getEthRouter() {
    this.midgardService.getInboundAddresses().subscribe((addresses) => {
      const ethInbound = addresses.find((inbound) => inbound.chain === 'ETH');
      if (ethInbound) {
        this.ethRouter = ethInbound.router;
      }
    });
  }

  contractApproved() {
    this.ethContractApprovalRequired = false;
  }

  async checkContractApproved(asset: Asset) {
    console.log('checking contract approved');
    console.log('eth router is: ', this.ethRouter);
    console.log('user is: ', this.user);
    console.log('=================================');
    if (this.ethRouter && this.user) {
      console.log('eth router and user exist');
      const assetAddress = asset.symbol.slice(asset.ticker.length + 1);
      const strip0x = assetAddress.substr(2);
      const isApproved = await this.user.clients.ethereum.isApproved(
        this.ethRouter,
        strip0x,
        baseAmount(1)
      );
      console.log('is approved?', isApproved);
      this.ethContractApprovalRequired = !isApproved;
    }
  }

  updateRuneAmount() {
    const runeAmount = getValueOfAssetInRune(
      assetToBase(assetAmount(this.assetAmount)),
      this.assetPoolData
    );
    this.runeAmount = runeAmount.amount().isLessThan(0)
      ? 0
      : runeAmount
          .amount()
          .div(10 ** 8)
          .toNumber();
  }

  updateAssetAmount() {
    const depositAssetAmount = getValueOfRuneInAsset(
      assetToBase(assetAmount(this.runeAmount)),
      this.assetPoolData
    );
    this.assetAmount = depositAssetAmount.amount().isLessThan(0)
      ? 0
      : depositAssetAmount
          .amount()
          .div(10 ** 8)
          .toNumber();
  }

  async getPoolDetail(asset: string) {
    if (!this.inboundAddresses) {
      console.error('error fetching inbound addresses');
      return;
    }

    this.loading = true;

    this.midgardService.getPool(asset).subscribe(
      (res) => {
        if (res) {
          this.assetPoolData = {
            assetBalance: baseAmount(res.assetDepth),
            runeBalance: baseAmount(res.runeDepth),
          };

          this.networkFee = this.txUtilsService.calculateNetworkFee(
            this.asset,
            this.inboundAddresses,
            'INBOUND',
            res
          );

          this.chainNetworkFee = this.txUtilsService.calculateNetworkFee(
            getChainAsset(this.asset.chain),
            this.inboundAddresses,
            'INBOUND',
            res
          );

          this.runeFee = this.txUtilsService.calculateNetworkFee(
            new Asset('THOR.RUNE'),
            this.inboundAddresses,
            'INBOUND',
            res
          );

          this.loading = false;
        }
      },
      (err) => {
        console.error('error getting pool detail: ', err);
        this.poolNotFoundErr = true;
      }
    );
  }

  getPools() {
    this.midgardService.getPools().subscribe(
      (res) => {
        this.selectableMarkets = res
          .sort((a, b) => a.asset.localeCompare(b.asset))
          .map((pool) => ({
            asset: new Asset(pool.asset),
            assetPriceUSD: +pool.assetPriceUSD,
          }))
          // filter out until we can add support
          .filter(
            (pool) =>
              pool.asset.chain === 'BNB' ||
              pool.asset.chain === 'BTC' ||
              pool.asset.chain === 'ETH' ||
              pool.asset.chain === 'LTC' ||
              pool.asset.chain === 'BCH'
          )

          // filter out non-native RUNE tokens
          .filter((pool) => !isNonNativeRuneToken(pool.asset))

          // filter out halted chains
          .filter((pool) => !this.haltedChains.includes(pool.asset.chain));
      },
      (err) => console.error('error fetching pools:', err)
    );
  }

  validate(): void {
    /** Wallet not connected */
    if (!this.balances) {
      this.formValidation = {
        message: 'Please connect wallet',
        isValid: false,
      };
      return;
    }

    if (this.depositsDisabled) {
      this.formValidation = {
        message: 'Pool Cap > 90%',
        isValid: false,
      };
      return;
    }

    if (this.isHalted) {
      this.formValidation = {
        message: 'Pool Halted',
        isValid: false,
      };
      return;
    }

    /** User either lacks asset balance or RUNE balance */
    if (this.balances && !this.runeAmount && !this.assetAmount) {
      this.formValidation = {
        message: 'Enter an amount',
        isValid: false,
      };
      return;
    }

    /** Asset amount is greater than balance */
    if (this.requiresAsset() && this.assetBalance < this.assetAmount) {
      this.formValidation = {
        message: `Insufficient ${this.asset.ticker}`,
        isValid: false,
      };
      return;
    }

    /** RUNE amount exceeds RUNE balance. Leave 3 RUNE in balance */
    if (this.runeBalance - this.runeAmount < 3) {
      this.formValidation = {
        message: 'Min 3 RUNE in Wallet',
        isValid: false,
      };
      return;
    }

    /** Checks sufficient chain balance for fee */
    if (this.sourceChainBalance <= this.chainNetworkFee) {
      this.formValidation = {
        message: `Insufficient ${this.asset.chain}`,
        isValid: false,
      };
      return;
    }

    /**
     * Asset matches chain asset
     * check balance + amount < chain_network_fee
     */
    if (
      this.requiresAsset() &&
      assetToString(getChainAsset(this.asset.chain)) ===
        assetToString(this.asset) &&
      this.assetAmount + this.networkFee * 4 >=
        this.userService.maximumSpendableBalance(
          this.asset,
          this.sourceChainBalance,
          this.inboundAddresses
        )
    ) {
      this.formValidation = {
        message: `Insufficient ${this.asset.chain}`,
        isValid: false,
      };
      return;
    }

    /** Amount is too low, considered "dusting" */
    if (this.assetAmount <= this.userService.minimumSpendable(this.asset)) {
      this.formValidation = {
        message: '!! Amount too low',
        isValid: false,
      };
      return;
    }

    /**
     * Deposit amount should be more than outbound fee + inbound fee network fee costs
     * Ensures sufficient amount to withdraw
     */
    if (this.assetAmount <= this.networkFee * 4) {
      this.formValidation = {
        message: 'Amount too low',
        isValid: false,
      };
      return;
    }

    // SYM good to go
    if (
      this.poolType === 'SYM' &&
      this.runeAmount &&
      this.assetAmount &&
      this.runeAmount <= this.runeBalance &&
      this.assetAmount <= this.assetBalance
    ) {
      this.formValidation = {
        message: 'Deposit',
        isValid: true,
      };
      return;
    }

    // ASYM_ASSET good to go
    if (
      this.poolType === 'ASYM_ASSET' &&
      this.assetAmount &&
      this.assetAmount + this.networkFee * 3 <= this.assetBalance
    ) {
      this.formValidation = {
        message: 'Deposit',
        isValid: true,
      };
      return;
    }

    // ASYM_RUNE good to go
    if (
      this.poolType === 'ASYM_RUNE' &&
      this.runeAmount &&
      this.runeAmount + this.runeFee <= this.runeBalance
    ) {
      this.formValidation = {
        message: 'Deposit',
        isValid: true,
      };
      return;
    }

    this.formValidation = {
      message: 'Form Invalid',
      isValid: false,
    };
  }

  requiresAsset(): boolean {
    return this.poolType === 'SYM' || this.poolType === 'ASYM_ASSET';
  }

  openConfirmationDialog() {
    const runeBasePrice = getValueOfAssetInRune(
      assetToBase(assetAmount(1)),
      this.assetPoolData
    )
      .amount()
      .div(10 ** 8)
      .toNumber();
    const assetBasePrice = getValueOfRuneInAsset(
      assetToBase(assetAmount(1)),
      this.assetPoolData
    )
      .amount()
      .div(10 ** 8)
      .toNumber();

    const dialogRef = this.dialog.open(ConfirmDepositModalComponent, {
      width: '50vw',
      maxWidth: '420px',
      minWidth: '260px',
      data: {
        asset: this.asset,
        rune: this.rune,
        assetAmount: this.assetAmount,
        runeAmount: this.runeAmount,
        user: this.user,
        estimatedFee: this.networkFee,
        runeFee: this.runeFee,
        poolTypeOption: this.poolType,
        runeBasePrice,
        assetBasePrice,
      },
    });

    dialogRef.afterClosed().subscribe((transactionSuccess: boolean) => {
      if (transactionSuccess) {
        this.assetAmount = null;
        this.runeAmount = null;
      }
    });
  }

  back(): void {
    this.router.navigate(['/', 'pool']);
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}
