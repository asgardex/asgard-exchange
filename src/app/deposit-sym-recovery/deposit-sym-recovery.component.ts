import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { getValueOfAssetInRune } from '@thorchain/asgardex-util';
import { Balances } from '@xchainjs/xchain-client';
import { assetAmount, assetToBase, assetToString, BaseAmount, baseAmount, bn } from '@xchainjs/xchain-util';
import { combineLatest, Subscription } from 'rxjs';
import { Asset, isNonNativeRuneToken } from '../_classes/asset';
import { AssetAndBalance } from '../_classes/asset-and-balance';
import { PoolAddressDTO } from '../_classes/pool-address';
import { User } from '../_classes/user';
import { MarketsModalComponent } from '../_components/markets-modal/markets-modal.component';
import { TransactionConfirmationState } from '../_const/transaction-confirmation-state';
import { EthUtilsService } from '../_services/eth-utils.service';
import { KeystoreDepositService } from '../_services/keystore-deposit.service';
import { MidgardService } from '../_services/midgard.service';
import { NetworkQueueService } from '../_services/network-queue.service';
import { TransactionStatusService, TxActions, TxStatus } from '../_services/transaction-status.service';
import { TransactionUtilsService } from '../_services/transaction-utils.service';
import { UserService } from '../_services/user.service';

@Component({
  selector: 'app-deposit-sym-recovery',
  templateUrl: './deposit-sym-recovery.component.html',
  styleUrls: ['./deposit-sym-recovery.component.scss']
})
export class DepositSymRecoveryComponent implements OnInit, OnDestroy {

  rune: Asset;
  selectableMarkets: AssetAndBalance[];
  subs: Subscription[];
  balances: Balances;
  searchingAsset: Asset;
  user: User;
  runeNativeTxFee: number;

  missingAsset: Asset;
  missingAssetAmount: number;
  missingAssetBalance: number;
  maximumSpendableEth: number;
  networkFee: number;
  inboundAddresses: PoolAddressDTO[];
  txState: TransactionConfirmationState;
  error: string;
  outboundQueue: number;
  depositsDisabled: boolean;
  runeBalance: number;
  outboundTransactionFee: number;

  constructor(
    private router: Router,
    private midgardService: MidgardService,
    private userService: UserService,
    private dialog: MatDialog,
    private ethUtilsService: EthUtilsService,
    private keystoreDepositService: KeystoreDepositService,
    private txUtilsService: TransactionUtilsService,
    private txStatusService: TransactionStatusService,
    private networkQueueService: NetworkQueueService
  ) {
    this.outboundQueue = 0;
    this.rune = new Asset('THOR.RUNE');
    this.depositsDisabled = false;
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;
    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {
        this.balances = balances;
        this.runeBalance = this.userService.findBalance(balances, this.rune);
      }
    );

    const queue$ = this.networkQueueService.networkQueue$.subscribe(
      (queue) => this.outboundQueue = queue.outbound
    );

    const user$ = this.userService.user$.subscribe(
      (user) => {
        this.user = user;
      }
    );

    this.subs = [balances$, user$, queue$];
  }

  ngOnInit(): void {
    this.getPools();
    this.getPoolCap();
    this.getConstants();
  }

  getConstants() {
    this.midgardService.getConstants().subscribe(
      (res) => {
        this.outboundTransactionFee = bn(res.int_64_values.OutboundTransactionFee).div(10 ** 8).toNumber();
      },
      (err) => console.error('error fetching constants: ', err)
    );
  }


  getPools() {
    this.midgardService.getPools().subscribe(
      (res) => {
        this.selectableMarkets = res.sort( (a, b) => a.asset.localeCompare(b.asset) ).map((pool) => ({
          asset: new Asset(pool.asset),
          assetPriceUSD: +pool.assetPriceUSD
        }))
        // filter out until we can add support
        .filter( (pool) => pool.asset.chain === 'BNB'
          || pool.asset.chain === 'BTC'
          || pool.asset.chain === 'ETH'
          || pool.asset.chain === 'LTC'
          || pool.asset.chain === 'BCH')

         // filter out non-native RUNE tokens
        .filter( (pool) => !isNonNativeRuneToken(pool.asset));
      },
      (err) => console.error('error fetching pools:', err)
    );
  }

  selectPool() {
    const dialogRef = this.dialog.open(
      MarketsModalComponent,
      {
        minWidth: '260px',
        maxWidth: '420px',
        width: '50vw',
        data: {
          // disabledAssetSymbol: this.disabledAssetSymbol,
          selectableMarkets: this.selectableMarkets
        }
      }
    );

    dialogRef.afterClosed().subscribe( (result: Asset) => {

      if (result) {
        this.searchingAsset = result;
        this.searchLiquidityProviders(this.searchingAsset);
      } else {
        console.log('nothing selected');
      }

    });

  }

  async searchLiquidityProviders(asset: Asset) {
    this.missingAsset = null;
    this.missingAssetAmount = null;
    this.missingAssetBalance = null;
    this.inboundAddresses = await this.midgardService.getInboundAddresses().toPromise();

    const liquidityProviders$ = this.midgardService.getThorchainLiquidityProviders(assetToString(asset));
    const pool$ = this.midgardService.getPool(assetToString(asset));
    const combined = combineLatest([liquidityProviders$, pool$]);
    const sub = combined.subscribe( ([providers, pool]) => {

      if (!pool) {
        console.error('no pool found');
        return;
      }

      if (!providers) {
        console.error('no providers found');
        return;
      }

      const thorAddress = this.user.clients.thorchain.getAddress();
      const assetAddress = this.userService.getTokenAddress(this.user, asset.chain);

      const matches = providers.filter((provider) => (provider.asset_address === assetAddress && provider.rune_address === thorAddress))
        .filter( (provider) =>
          // user required RUNE tx deposit
          (+provider.pending_asset > 0 && +provider.pending_rune <= 0)
          // user requires ASSET tx deposit
          || (+provider.pending_rune > 0 && +provider.pending_asset <= 0) );

      if (matches.length <= 0) {
        return;
      }

      this.missingAsset = (+matches[0].pending_asset > 0 && +matches[0].pending_rune <= 0)
        ? this.rune
        : asset;

      const poolData = {
        assetBalance: baseAmount(pool.assetDepth),
        runeBalance: baseAmount(pool.runeDepth),
      };

      this.missingAssetBalance = this.userService.findBalance(this.balances, this.missingAsset);
      if (this.missingAsset.chain === 'ETH') {
        this.getMaximumSpendableEth(this.missingAsset, this.missingAssetBalance);
      }

      this.networkFee = this.txUtilsService.calculateNetworkFee(this.missingAsset, this.inboundAddresses, pool);

      this.updateRuneAmount(matches[0].pending_asset, poolData);

    });

    this.subs.push(sub);

  }

  async getMaximumSpendableEth(missingAsset: Asset, missingAssetBalance: number) {
    if (missingAsset && this.user) {
      this.maximumSpendableEth = await this.ethUtilsService.maximumSpendableBalance({
        asset: missingAsset,
        client: this.user.clients.ethereum,
        balance: missingAssetBalance ?? 0
      });
    }
  }

  getPoolCap() {
    const mimir$ = this.midgardService.getMimir();
    const network$ = this.midgardService.getNetwork();
    const combined = combineLatest([mimir$, network$]);
    const sub = combined.subscribe( ([mimir, network]) => {

      const totalPooledRune = +network.totalPooledRune / (10 ** 8);

      if (mimir && mimir['mimir//MAXLIQUIDITYRUNE']) {
        const maxLiquidityRune = mimir['mimir//MAXLIQUIDITYRUNE'] / (10 ** 8);
        this.depositsDisabled = (totalPooledRune / maxLiquidityRune >= .9);
      }

    });

    this.subs.push(sub);
  }

  submitDisabled(): boolean {
    /** Wallet not connected */
    if (!this.balances) {
      return true;
    }

    /** User either lacks asset balance or RUNE balance */
    if (this.balances && (!this.missingAssetAmount)) {
      return true;
    }

    if (!this.missingAsset) {
      return true;
    }

    if (!this.missingAssetBalance) {
      return true;
    }

    if (this.depositsDisabled) {
      return true;
    }

    if (this.runeBalance < 3) {
      return true;
    }

    if ( (this.missingAsset.chain === 'BNB') && this.userService.findBalance(this.balances, new Asset('BNB.BNB')) < 0.000375 ) {
      return true;
    }

    // /** ETH tx amount is higher than spendable amount */
    if ( (this.missingAsset.chain === 'ETH') && this.missingAssetAmount > this.maximumSpendableEth) {
      return true;
    }

    /** Non-ETH chain tx amount is higher than spendable amount */
    if ((this.missingAsset.chain !== 'ETH')
      && ( this.missingAssetAmount > this.userService.maximumSpendableBalance(this.missingAsset, this.missingAssetBalance))) {
      return true;
    }

    // /** Amount is too low, considered "dusting" */
    if ( (this.missingAssetAmount <= this.userService.minimumSpendable(this.missingAsset))) {
      return true;
    }

    return false;
  }

  mainButtonText(): string {

    /** Wallet not connected */
    if (!this.balances) {
      return 'Please connect wallet';
    }

    /** User either lacks asset balance or RUNE balance */
    if (this.balances && (!this.missingAssetAmount)) {
      return 'Enter an amount';
    }

    if (!this.missingAsset) {
      return 'No missing Asset';
    }

    if (this.depositsDisabled) {
      return 'Pool Cap > 90%';
    }

    if (!this.missingAssetBalance) {
      return 'Insufficient Balance';
    }

    if (this.runeBalance < 3) {
      return 'Min 3 RUNE in Wallet Required';
    }

    if ( (this.missingAsset.chain === 'BNB') && this.userService.findBalance(this.balances, new Asset('BNB.BNB')) < 0.000375 ) {
      return 'Insufficient BNB';
    }

    // /** ETH tx amount is higher than spendable amount */
    if ( (this.missingAsset.chain === 'ETH') && this.missingAssetAmount > this.maximumSpendableEth) {
      return 'Insufficient ETH';
    }

    /** Non-ETH chain tx amount is higher than spendable amount */
    if ((this.missingAsset.chain !== 'ETH')
      && ( this.missingAssetAmount > this.userService.maximumSpendableBalance(this.missingAsset, this.missingAssetBalance))) {
      return 'Insufficient balance';
    }

    // /** Amount is too low, considered "dusting" */
    if ( (this.missingAssetAmount <= this.userService.minimumSpendable(this.missingAsset))) {
      return 'Amount too low';
    }

    return `Resubmit ${this.missingAsset.chain}.${this.missingAsset.ticker}`;

  }

  updateRuneAmount(amount: string, poolData: {assetBalance: BaseAmount, runeBalance: BaseAmount}) {
    const runeAmount = getValueOfAssetInRune(baseAmount(amount), poolData);
    this.missingAssetAmount = runeAmount.amount().isLessThan(0) ? 0 : runeAmount.amount().div(10 ** 8).toNumber();
  }

  async submitDeposit() {

    this.txState = TransactionConfirmationState.SUBMITTING;
    this.error = null;

    try {

      const inboundAddresses = await this.midgardService.getInboundAddresses().toPromise();
      const thorchainAddress = this.user.clients.thorchain.getAddress();
      // find recipient pool
      const recipientPool = inboundAddresses.find( (pool) => pool.chain === this.searchingAsset.chain );
      console.log('recipient pool is: ', recipientPool);

      if (!recipientPool) {
        console.error('no recipient pool found');
        this.error = 'no recipeint pool found';
        this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;
      }

      let hash = '';

      switch (this.missingAsset.chain) {
        case 'BTC':
          hash = await this.keystoreDepositService.bitcoinDeposit({
            asset: this.missingAsset,
            inputAmount: this.missingAssetAmount,
            client: this.user.clients.bitcoin,
            balances: this.balances,
            thorchainAddress,
            recipientPool,
            estimatedFee: this.networkFee
          });
          break;

        case 'BNB':
          hash = await this.keystoreDepositService.binanceDeposit({
            asset: this.missingAsset,
            inputAmount: this.missingAssetAmount,
            client: this.user.clients.binance,
            thorchainAddress,
            recipientPool
          });
          break;

        case 'LTC':
          hash = await this.keystoreDepositService.litecoinDeposit({
            asset: this.missingAsset,
            inputAmount: this.missingAssetAmount,
            client: this.user.clients.litecoin,
            balances: this.balances,
            thorchainAddress,
            recipientPool,
            estimatedFee: this.networkFee
          });
          break;

        case 'BCH':
          hash = await this.keystoreDepositService.bchDeposit({
            asset: this.missingAsset,
            inputAmount: this.missingAssetAmount,
            client: this.user.clients.bitcoinCash,
            balances: this.balances,
            thorchainAddress,
            recipientPool,
            estimatedFee: this.networkFee
          });
          break;

        case 'ETH':
          hash = await this.keystoreDepositService.ethereumDeposit({
            asset: this.missingAsset,
            inputAmount: this.missingAssetAmount,
            balances: this.balances,
            client: this.user.clients.ethereum,
            thorchainAddress,
            recipientPool
          });
          break;

        case 'THOR':
          const address = this.userService.getTokenAddress(this.user, this.searchingAsset.chain);
          hash = await this.keystoreDepositService.runeDeposit({
            client: this.user.clients.thorchain,
            inputAmount: this.missingAssetAmount,
            memo: `+:${this.searchingAsset.chain}.${this.searchingAsset.symbol}:${address}`
          });
          break;

      }

      this.txStatusService.addTransaction({
        chain: this.missingAsset.chain,
        hash,
        ticker: `${this.missingAsset.ticker}-RUNE`,
        status: TxStatus.PENDING,
        action: TxActions.DEPOSIT,
        symbol: this.missingAsset.symbol,
        isThorchainTx: true
      });

      this.txState = TransactionConfirmationState.SUCCESS;

    } catch (error) {
      console.error('error depositing: ', error);
      this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;
      this.error = error;
    }

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
    const memo = `WITHDRAW:${this.searchingAsset.chain}.${this.searchingAsset.symbol}:100`;

    // withdraw RUNE
    try {
      const hash = await thorClient.deposit({
        amount: txCost,
        memo,
      });

      this.txState = TransactionConfirmationState.SUCCESS;
      this.txStatusService.addTransaction({
        chain: 'THOR',
        hash,
        ticker: `${this.searchingAsset.ticker}-RUNE`,
        symbol: this.searchingAsset.symbol,
        status: TxStatus.PENDING,
        action: TxActions.WITHDRAW,
        isThorchainTx: true,
        pollThornodeDirectly: true
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
