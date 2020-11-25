import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CGCoinListItem, CoinGeckoService } from '../_services/coin-gecko.service';
import { MidgardService } from '../_services/midgard.service';
import { Asset } from '../_classes/asset';
import { environment } from 'src/environments/environment';
import { UserService } from '../_services/user.service';
import { Balances } from '@xchainjs/xchain-client';
import { AssetAndBalance } from '../_classes/asset-and-balance';
import { ConfirmPoolCreateComponent } from './confirm-pool-create/confirm-pool-create.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-pool-create',
  templateUrl: './pool-create.component.html',
  styleUrls: ['./pool-create.component.scss']
})
export class PoolCreateComponent implements OnInit, OnDestroy {

  runeSymbol = environment.network === 'chaosnet' ? 'RUNE-B1A' : 'RUNE-67C';

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

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private midgardService: MidgardService,
    private cgService: CoinGeckoService,
    private userService: UserService,
  ) {
    this.rune = new Asset(`BNB.${this.runeSymbol}`);

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

    this.subs = [balances$];

  }

  ngOnInit(): void {

    const params$ = this.route.queryParamMap.subscribe( (params) => {

      const pool = params.get('pool');

      if (pool) {
        this.asset = new Asset(pool);
        this.checkExisting(pool);
        this.getUsdValue();
        if (this.balances) {
          this.assetBalance = this.userService.findBalance(this.balances, this.asset);
        }
      } else {
        this.router.navigate(['/', 'pool']);
      }

    });

    this.getCoinGeckoCoinList();

    this.subs.push(params$);

  }

  checkExisting(currentPool: string) {
    this.midgardService.getPools().subscribe(
      (res) => {
        this.pools = res;
        if (res.includes(currentPool)) {
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
      }
    }
  }

  getRuneValue() {
    if (this.coinGeckoList) {
      const id = this.cgService.getCoinIdBySymbol('RUNE', this.coinGeckoList);
      if (id) {
        this.cgService.getCurrencyConversion(id).subscribe(
          (res) => {
            console.log('rune val is: ', res);
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
      this.runeAmount = totalAssetValue / this.runeUsdValue;
    }
  }

  formDisabled(): boolean {

    return !this.balances || !this.runeAmount || !this.assetAmount || this.insufficientBnb || this.runeAmount < 1000
    || (this.balances
      && (this.runeAmount > this.runeBalance || this.assetAmount > this.userService.maximumSpendableBalance(this.asset, this.assetBalance))
    );
  }

  mainButtonText(): string {

    if (!this.balances) {
      return 'Please connect wallet';
    } else if (this.balances && (!this.runeAmount || !this.assetAmount)) {
      return 'Enter an amount';
    } else if (this.balances && (this.runeAmount > this.runeBalance
      || this.assetAmount > this.userService.maximumSpendableBalance(this.asset, this.assetBalance))) {
      return 'Insufficient balance';
    } else if (this.insufficientBnb) {
      return 'Insufficient BNB for Fee';
    } else if (this.runeAmount < 1000) {
      return 'Not enough RUNE to create pool';
    } else if (this.balances && this.runeAmount && this.assetAmount
      && (this.runeAmount <= this.runeBalance) && (this.assetAmount <= this.assetBalance)) {
      return 'Create Pool';
    } else {
      console.warn('mismatch case for main button text');
      return;
    }
  }

  checkCreateableMarkets() {

    const runeSymbol = environment.network === 'chaosnet' ? 'RUNE-B1A' : 'RUNE-67C';

    if (this.pools && this.balances) {

      this.selectableMarkets = this.balances.filter( (balance) => {
        const asset = balance.asset;
        return !this.pools.find((pool) => pool === `${asset.chain}.${asset.symbol}`)
          && asset.symbol !== runeSymbol;
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

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
