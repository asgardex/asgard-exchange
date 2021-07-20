import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { getValueOfAssetInRune } from '@thorchain/asgardex-util';
import { Balance } from '@xchainjs/xchain-client';
import {
  assetAmount,
  assetToBase,
  assetToString,
  BaseAmount,
  baseAmount,
  bn,
  Chain,
} from '@xchainjs/xchain-util';
import { Subscription } from 'rxjs';
import { Asset, isNonNativeRuneToken } from '../_classes/asset';
import { AssetAndBalance } from '../_classes/asset-and-balance';
import { LiquidityProvider } from '../_classes/liquidity-provider';
import { PoolDTO } from '../_classes/pool';
import { PoolAddressDTO } from '../_classes/pool-address';
import { User } from '../_classes/user';
import { MarketsModalComponent } from '../_components/markets-modal/markets-modal.component';
import { TransactionConfirmationState } from '../_const/transaction-confirmation-state';
import { MidgardService } from '../_services/midgard.service';
import { NetworkQueueService } from '../_services/network-queue.service';
import {
  TransactionStatusService,
  TxActions,
  TxStatus,
} from '../_services/transaction-status.service';
import { TransactionUtilsService } from '../_services/transaction-utils.service';
import { UserService } from '../_services/user.service';

@Component({
  selector: 'app-deposit-sym-recovery',
  templateUrl: './deposit-sym-recovery.component.html',
  styleUrls: ['./deposit-sym-recovery.component.scss'],
})
export class DepositSymRecoveryComponent implements OnInit, OnDestroy {
  rune: Asset;
  selectableMarkets: AssetAndBalance[];
  subs: Subscription[];
  balances: Balance[];
  searchingAsset: Asset;
  user: User;
  runeNativeTxFee: number;

  missingAsset: Asset;
  missingAssetAmount: number;
  missingAssetBalance: number;
  pendingAsset: Asset;
  pendingAmount: number;
  networkFee: number;
  inboundAddresses: PoolAddressDTO[];
  txState: TransactionConfirmationState;
  error: string;
  outboundQueue: number;
  depositsDisabled: boolean;
  runeBalance: number;
  outboundTransactionFee: number;
  pool?: PoolDTO;
  formValidation: {
    message: string;
    isValid: boolean;
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private midgardService: MidgardService,
    private userService: UserService,
    private dialog: MatDialog,
    private txUtilsService: TransactionUtilsService,
    private txStatusService: TransactionStatusService,
    private networkQueueService: NetworkQueueService
  ) {
    this.outboundQueue = 0;
    this.rune = new Asset('THOR.RUNE');
    this.depositsDisabled = false;
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;
    this.formValidation = {
      message: 'Loading',
      isValid: false,
    };

    const balances$ = this.userService.userBalances$.subscribe((balances) => {
      this.balances = balances;
      this.runeBalance = this.userService.findBalance(balances, this.rune);
      this.validate();
    });

    const queue$ = this.networkQueueService.networkQueue$.subscribe(
      (queue) => (this.outboundQueue = queue.outbound)
    );

    const user$ = this.userService.user$.subscribe((user) => {
      this.user = user;
      if (this.searchingAsset && !this.missingAsset) {
        this.searchLiquidityProviders(this.searchingAsset);
      }
      this.validate();
    });

    this.subs = [balances$, user$, queue$];
  }

  ngOnInit(): void {
    this.getPools();
    this.getConstants();

    const params$ = this.route.paramMap.subscribe((params) => {
      const asset = params.get('asset');

      if (asset && asset.length > 0) {
        this.searchingAsset = new Asset(asset);
        this.searchLiquidityProviders(this.searchingAsset);
      }

      this.validate();
    });

    this.subs.push(params$);
  }

  getConstants() {
    this.midgardService.getConstants().subscribe(
      (res) => {
        this.outboundTransactionFee = bn(
          res.int_64_values.OutboundTransactionFee
        )
          .div(10 ** 8)
          .toNumber();
      },
      (err) => console.error('error fetching constants: ', err)
    );
  }

  getPools() {
    this.midgardService.getPools().subscribe(
      (res) => {
        this.selectableMarkets = res
          .sort((a, b) => a.asset.localeCompare(b.asset))
          .filter((pool) => pool.status === 'available')
          .filter((pool) => +pool.runeDepth > 0)
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
          .filter((pool) => !isNonNativeRuneToken(pool.asset));

        this.validate();
      },
      (err) => console.error('error fetching pools:', err)
    );
  }

  selectPool() {
    const dialogRef = this.dialog.open(MarketsModalComponent, {
      minWidth: '260px',
      maxWidth: '420px',
      width: '50vw',
      data: {
        // disabledAssetSymbol: this.disabledAssetSymbol,
        selectableMarkets: this.selectableMarkets,
      },
    });

    dialogRef.afterClosed().subscribe((result: Asset) => {
      if (result) {
        this.router.navigate([
          '/',
          'deposit-sym-recovery',
          assetToString(result),
        ]);
      }
    });
  }

  async searchLiquidityProviders(asset: Asset) {
    this.missingAsset = null;
    this.missingAssetAmount = null;
    this.missingAssetBalance = null;
    this.inboundAddresses = await this.midgardService
      .getInboundAddresses()
      .toPromise();

    const matches = await this.getLiquidityProviders(asset);
    if (!matches) {
      return;
    }

    const poolData = await this.getPoolData(asset);

    if (matches && poolData) {
      this.updateRuneAmount(matches[0].pending_asset, poolData);
    }

    this.validate();
  }

  async getPoolData(
    asset: Asset
  ): Promise<{ assetBalance: BaseAmount; runeBalance: BaseAmount }> {
    try {
      this.pool = await this.midgardService
        .getPool(assetToString(asset))
        .toPromise();

      const poolData = {
        assetBalance: baseAmount(this.pool.assetDepth),
        runeBalance: baseAmount(this.pool.runeDepth),
      };

      this.missingAssetBalance = this.userService.findBalance(
        this.balances,
        this.missingAsset
      );

      this.networkFee = this.txUtilsService.calculateNetworkFee(
        this.missingAsset,
        this.inboundAddresses,
        'OUTBOUND',
        this.pool
      );

      return poolData;
    } catch (error) {
      console.log('error fetching pool data');
    }
  }

  async getLiquidityProviders(asset: Asset): Promise<LiquidityProvider[]> {
    try {
      if (!this.user) {
        return;
      }

      const providers = await this.midgardService
        .getThorchainLiquidityProviders(assetToString(asset))
        .toPromise();

      if (!providers) {
        console.error('no providers found');
        return;
      }

      const thorAddress = this.user.clients.thorchain.getAddress();
      const assetAddress = this.userService.getTokenAddress(
        this.user,
        asset.chain
      );

      const matches = providers
        .filter(
          (provider) =>
            provider.asset_address === assetAddress &&
            provider.rune_address === thorAddress
        )
        .filter(
          (provider) =>
            // user required RUNE tx deposit
            (+provider.pending_asset > 0 && +provider.pending_rune <= 0) ||
            // user requires ASSET tx deposit
            (+provider.pending_rune > 0 && +provider.pending_asset <= 0)
        );

      if (matches.length <= 0) {
        return;
      }

      this.missingAsset =
        +matches[0].pending_asset > 0 && +matches[0].pending_rune <= 0
          ? this.rune
          : asset;

      this.pendingAsset =
        +matches[0].pending_asset <= 0 && +matches[0].pending_rune > 0
          ? this.rune
          : asset;

      const pendingAmount =
        +matches[0].pending_asset <= 0 && +matches[0].pending_rune > 0
          ? +matches[0].pending_rune
          : +matches[0].pending_asset;

      this.pendingAmount = bn(pendingAmount)
        .div(10 ** 8)
        .toNumber();

      return matches;
    } catch (error) {
      console.log('error fetching liquidity provider: ', error);
    }
  }

  validate() {
    if (!this.balances) {
      this.formValidation = {
        message: 'Please Connect Wallet',
        isValid: false,
      };
      return;
    }

    if (!this.runeBalance || this.runeBalance < 0.2) {
      this.formValidation = {
        message: 'Insufficient RUNE',
        isValid: false,
      };
      return;
    }

    if (!this.pool) {
      this.formValidation = {
        message: 'Loading',
        isValid: false,
      };
      return;
    }

    if (this.pool && this.pool.status !== 'available') {
      this.formValidation = {
        message: `Pool ${this.pool.status}`,
        isValid: false,
      };
      return;
    }

    if (this.pool && +this.pool.runeDepth <= 0) {
      this.formValidation = {
        message: `Pool Empty`,
        isValid: false,
      };
      return;
    }

    this.formValidation = {
      message: `Withdraw All`,
      isValid: true,
    };
  }

  updateRuneAmount(
    amount: string,
    poolData: { assetBalance: BaseAmount; runeBalance: BaseAmount }
  ) {
    const runeAmount = getValueOfAssetInRune(baseAmount(amount), poolData);
    this.missingAssetAmount = runeAmount.amount().isLessThan(0)
      ? 0
      : runeAmount
          .amount()
          .div(10 ** 8)
          .toNumber();
  }

  async withdrawPendingDeposit() {
    this.txState = TransactionConfirmationState.SUBMITTING;

    const thorClient = this.user.clients.thorchain;
    if (!thorClient) {
      console.error('no thor client found!');
      return;
    }

    const txCost = assetToBase(assetAmount(0.00000001));

    // withdraw 100%
    const memo = `WITHDRAW:${this.searchingAsset.chain}.${this.searchingAsset.symbol}:10000`;

    // withdraw RUNE
    try {
      const hash = await thorClient.deposit({
        amount: txCost,
        memo,
      });

      this.txState = TransactionConfirmationState.SUCCESS;
      this.txStatusService.addTransaction({
        chain: Chain.THORChain,
        hash,
        ticker: `${this.searchingAsset.ticker}-RUNE`,
        symbol: this.searchingAsset.symbol,
        status: TxStatus.PENDING,
        action: TxActions.WITHDRAW,
        isThorchainTx: true,
        pollThornodeDirectly: true,
      });
    } catch (error) {
      console.error('error making RUNE withdraw: ', error);
      this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;
      this.error = error;
    }
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

  back() {
    this.router.navigate(['/', 'pool']);
  }
}
