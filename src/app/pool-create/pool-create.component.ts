import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { CGCoinListItem, CoinGeckoService } from '../_services/coin-gecko.service';
import { MidgardService } from '../_services/midgard.service';
import { Asset, isNonNativeRuneToken } from '../_classes/asset';
import { UserService } from '../_services/user.service';
import { Balances } from '@xchainjs/xchain-client';
import { AssetAndBalance } from '../_classes/asset-and-balance';
import { ConfirmPoolCreateComponent } from './confirm-pool-create/confirm-pool-create.component';
import { MatDialog } from '@angular/material/dialog';
import { User } from '../_classes/user';
import { baseAmount } from '@xchainjs/xchain-util';

@Component({
  selector: 'app-pool-create',
  templateUrl: './pool-create.component.html',
  styleUrls: ['./pool-create.component.scss']
})
export class PoolCreateComponent implements OnInit, OnDestroy {

  /**
   * Rune
   */
  rune: Asset;

  get runeAmount() {
    return this._runeAmount;
  }
  set runeAmount(val: number) {
    this._runeAmount = val;
  }
  _runeAmount: number;
  recommendedRuneAmount: number;

  /**
   * Asset
   */
  set asset(val: Asset) {

    if (val) {

      if (!this._asset) {
        this._asset = val;
      } else {

        if (val.symbol !== this._asset.symbol) {
          this.router.navigate(['/', 'create-pool'], {queryParams: {pool: `${val.chain}.${val.symbol}`}});
          this._asset = val;
          this.assetBalance = this.userService.findBalance(this.balances, this.asset);
        }

      }

    }

  }
  get asset() {
    return this._asset;
  }
  _asset: Asset;
  get assetAmount() {
    return this._assetAmount;
  }
  set assetAmount(val: number) {

    this._assetAmount = val;

    if (val) {
      this.updateRuneAmount();
    } else {
      this.runeAmount = null;
      this.recommendedRuneAmount = null;
    }

  }
  private _assetAmount: number;

  assetUsdValue: number;
  runeUsdValue: number;
  balances: Balances;
  subs: Subscription[];
  coinGeckoList: CGCoinListItem[];
  insufficientBnb: boolean;
  runeBalance: number;
  assetBalance: number;
  pools: string[];
  selectableMarkets: AssetAndBalance[];

  ethRouter: string;
  ethContractApprovalRequired: boolean;
  user: User;
  depositsDisabled: boolean;

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private midgardService: MidgardService,
    private cgService: CoinGeckoService,
    private userService: UserService,
  ) {
    this.rune = new Asset(`THOR.RUNE`);
    this.depositsDisabled = false;

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {
        this.balances = balances;
        this.runeBalance = this.userService.findBalance(this.balances, this.rune);
        if (this.asset) {
          this.assetBalance = this.userService.findBalance(this.balances, this.asset);
        }

        // allows us to ensure enough bnb balance
        const bnbBalance = this.userService.findBalance(this.balances, new Asset('BNB.BNB'));
        this.insufficientBnb = bnbBalance < 0.000375;
        this.checkCreateableMarkets();
      }
    );

    const user$ = this.userService.user$.subscribe(
      (user) => {
        this.user = user;

        if (this.asset && this.asset.chain === 'ETH' && this.asset.ticker !== 'ETH') {
          this.checkContractApproved(this.asset);
        }
      }
    );

    this.subs = [balances$, user$];

  }

  ngOnInit(): void {

    this.getEthRouter();

    const params$ = this.route.queryParamMap.subscribe( (params) => {

      const pool = params.get('pool');
      this.runeAmount = null;
      this.recommendedRuneAmount = null;

      if (pool) {
        this.asset = new Asset(pool);
        this.checkExisting(pool);
        this.getUsdValue();
        if (this.balances) {
          this.assetBalance = this.userService.findBalance(this.balances, this.asset);
        }

        if (this.asset.chain === 'ETH' && this.asset.ticker !== 'ETH') {
          this.checkContractApproved(this.asset);
        }

      } else {
        this.router.navigate(['/', 'pool']);
      }

    });

    this.getCoinGeckoCoinList();
    this.getPoolCap();

    this.subs.push(params$);

  }

  getPoolCap() {
    const mimir$ = this.midgardService.getMimir();
    const network$ = this.midgardService.getNetwork();
    const combined = combineLatest([mimir$, network$]);
    const sub = combined.subscribe( ([mimir, network]) => {

      const totalPooledRune = +network.totalPooledRune / (10 ** 8);

      if (mimir && mimir['mimir//MAXIMUMLIQUIDITYRUNE']) {
        const maxLiquidityRune = mimir['mimir//MAXIMUMLIQUIDITYRUNE'] / (10 ** 8);
        this.depositsDisabled = (totalPooledRune / maxLiquidityRune >= .9);
      }

    });

    this.subs.push(sub);
  }

  getEthRouter() {
    this.midgardService.getInboundAddresses().subscribe(
      (addresses) => {
        const ethInbound = addresses.find( (inbound) => inbound.chain === 'ETH' );
        if (ethInbound) {
          this.ethRouter = ethInbound.router;
        }
      }
    );
  }

  checkExisting(currentPool: string) {
    this.midgardService.getPools().subscribe(
      (res) => {
        const poolNames = res.map( (pool) => pool.asset );
        this.pools = poolNames;

        /** MCCN TESTING */
        if (this.pools.includes(currentPool)) {
          this.router.navigate(['/', 'deposit', currentPool]);
        }

        this.checkCreateableMarkets();
      }
    );
  }

  getCoinGeckoCoinList() {
    this.cgService.getCoinList().subscribe( (res) => {
      this.coinGeckoList = res;
      this.getUsdValue();
      this.getRuneValue();
    });
  }

  getUsdValue() {
    if (this.asset?.ticker && this.coinGeckoList) {
      const id = this.cgService.getCoinIdBySymbol(this.asset.ticker, this.coinGeckoList);
      if (id) {

        this.cgService.getCurrencyConversion(id).subscribe(
          (res) => {

            for (const [_key, value] of Object.entries(res)) {
              this.assetUsdValue = value.usd;
            }
          }
        );
      } else {
        this.assetUsdValue = null;
      }
    }
  }

  getRuneValue() {
    if (this.coinGeckoList) {
      const id = this.cgService.getCoinIdBySymbol('RUNE', this.coinGeckoList);
      if (id) {
        this.cgService.getCurrencyConversion(id).subscribe(
          (res) => {
            for (const [_key, value] of Object.entries(res)) {
              this.runeUsdValue = value.usd;
            }
          }
        );
      }
    }
  }

  updateRuneAmount() {
    if (this.assetUsdValue && this.runeUsdValue) {
      const totalAssetValue = this.assetAmount * this.assetUsdValue;
      this.recommendedRuneAmount = totalAssetValue / this.runeUsdValue;
      // this.runeAmount = totalAssetValue / this.runeUsdValue;
    } else {
      this.recommendedRuneAmount = null;
    }
  }

  formDisabled(): boolean {

    return !this.balances || !this.runeAmount || !this.assetAmount
    || this.insufficientBnb || this.runeAmount < 1000 || this.ethContractApprovalRequired
    || this.depositsDisabled
    || (this.balances
      && (this.runeAmount > this.runeBalance || this.assetAmount > this.userService.maximumSpendableBalance(this.asset, this.assetBalance))
    );

  }

  mainButtonText(): string {

    if (!this.balances) {
      return 'Please connect wallet';
    }
    else if (this.depositsDisabled) {
      return 'Pool Cap > 90%';
    }
    else if (this.ethContractApprovalRequired) {
      return 'Create Pool';
    } else if (this.balances && (!this.runeAmount || !this.assetAmount)) {
      return 'Enter an amount';
    } else if (this.balances && (this.runeAmount > this.runeBalance
      || this.assetAmount > this.userService.maximumSpendableBalance(this.asset, this.assetBalance))) {
      return 'Insufficient balance';
    } else if (this.insufficientBnb) {
      return 'Insufficient BNB for Fee';
    }
    else if (this.runeAmount < 1000) {
      return 'Not enough RUNE to create pool';
    }
    else if (this.balances && this.runeAmount && this.assetAmount
      && (this.runeAmount <= this.runeBalance) && (this.assetAmount <= this.assetBalance)) {
      return 'Create Pool';
    } else {
      console.warn('mismatch case for main button text');
      return;
    }
  }

  checkCreateableMarkets() {

    if (this.pools && this.balances) {

      // TODO: consolidate this is also used in pool.component
      this.selectableMarkets = this.balances.filter( (balance) => {
        const asset = balance.asset;

        return !this.pools.find((pool) => pool === `${asset.chain}.${asset.symbol}`)
          && !isNonNativeRuneToken(asset)
          && asset.chain !== 'THOR';

      }).map( (balance) => {
        return {asset: new Asset(`${balance.asset.chain}.${balance.asset.symbol}`)};
      });

    }

  }

  openConfirmationDialog() {

    const dialogRef = this.dialog.open(
      ConfirmPoolCreateComponent,
      {
        width: '50vw',
        maxWidth: '420px',
        minWidth: '260px',
        data: {
          asset: this.asset,
          rune: this.rune,
          assetAmount: this.assetAmount,
          runeAmount: this.runeAmount,
        }
      }
    );

    dialogRef.afterClosed().subscribe( (transactionSuccess: boolean) => {

      if (transactionSuccess) {
        this.assetAmount = 0;
      }

    });
  }

  async checkContractApproved(asset: Asset) {

    if (this.ethRouter && this.user) {
      const assetAddress = asset.symbol.slice(asset.ticker.length + 1);
      const strip0x = assetAddress.substr(2);
      const isApproved = await this.user.clients.ethereum.isApproved(this.ethRouter, strip0x, baseAmount(1));
      this.ethContractApprovalRequired = !isApproved;
    }

  }

  back() {
    this.router.navigate(['/', 'pool']);
  }


  contractApproved() {
    this.ethContractApprovalRequired = false;
  }


  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
