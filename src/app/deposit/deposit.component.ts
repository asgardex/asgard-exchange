import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { getValueOfAssetInRune, getValueOfRuneInAsset, PoolData } from '@thorchain/asgardex-util';
import {
  baseAmount,
  assetToBase,
  assetAmount,
} from '@xchainjs/xchain-util';
import { combineLatest, Subscription } from 'rxjs';
import { Asset } from '../_classes/asset';
import { MidgardService } from '../_services/midgard.service';
import { UserService } from '../_services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDepositModalComponent } from './confirm-deposit-modal/confirm-deposit-modal.component';
import { User } from '../_classes/user';
import { Balances } from '@xchainjs/xchain-client';
import { AssetAndBalance } from '../_classes/asset-and-balance';
import { EthUtilsService } from '../_services/eth-utils.service';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss']
})
export class DepositComponent implements OnInit, OnDestroy {


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
  assetPoolData: PoolData;

  /**
   * Balances
   */
  balances: Balances;
  runeBalance: number;
  assetBalance: number;

  user: User;
  insufficientBnb: boolean;
  subs: Subscription[];
  selectableMarkets: AssetAndBalance[];

  ethRouter: string;
  ethContractApprovalRequired: boolean;

  maximumSpendableEth: number;

  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private midgardService: MidgardService,
    private ethUtilsService: EthUtilsService
  ) {
    this.rune = new Asset('THOR.RUNE');

    this.subs = [];

  }

  ngOnInit(): void {

    const params$ = this.route.paramMap;
    const balances$ = this.userService.userBalances$
    const user$ = this.userService.user$

    const combined = combineLatest([params$, user$, balances$]);
    const sub = combined.subscribe( ([params, user, balances]) => {

      // User
      this.user = user;
      if (this.asset && this.asset.chain === 'ETH' && this.asset.ticker !== 'ETH') {
        this.checkContractApproved(this.asset);
      }

      // Balance
      this.balances = balances;
      this.runeBalance = this.userService.findBalance(this.balances, this.rune);
      this.assetBalance = this.userService.findBalance(this.balances, this.asset);

      // allows us to ensure enough bnb balance
      const bnbBalance = this.userService.findBalance(this.balances, new Asset('BNB.BNB'));
      this.insufficientBnb = bnbBalance < 0.000375;

      this.getMaximumSpendableEth();

      // Asset
      const asset = params.get('asset');

      if (asset) {
        this.asset = new Asset(asset);
        this.getPoolDetail(asset);
        this.assetBalance = this.userService.findBalance(this.balances, this.asset);

        if (this.asset.chain === 'ETH' && this.asset.ticker !== 'ETH') {
          this.checkContractApproved(this.asset);
        }
      }

    });

    this.getPools();
    this.getEthRouter();
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

  contractApproved() {
    this.ethContractApprovalRequired = false;
  }

  async checkContractApproved(asset: Asset) {

    if (this.ethRouter && this.user) {
      const assetAddress = asset.symbol.slice(asset.ticker.length + 1);
      const strip0x = assetAddress.substr(2);
      const isApproved = await this.user.clients.ethereum.isApproved(this.ethRouter, strip0x, baseAmount(1));
      this.ethContractApprovalRequired = !isApproved;
    }

  }

  updateRuneAmount() {

    const runeAmount = getValueOfAssetInRune(assetToBase(assetAmount(this.assetAmount)), this.assetPoolData);

    this.runeAmount = runeAmount.amount().div(10 ** 8 ).toNumber();

  }

  getPoolDetail(asset: string) {

    this.midgardService.getPool(asset).subscribe(
      (res) => {
        if (res) {
          this.assetPoolData = {
            assetBalance: baseAmount(res.assetDepth),
            runeBalance: baseAmount(res.runeDepth),
          };
        }
      },
      (err) => console.error('error getting pool detail: ', err)
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
          || pool.asset.chain === 'THOR'
          || pool.asset.chain === 'BTC'
          || pool.asset.chain === 'ETH'
          || pool.asset.chain === 'LTC'
          || pool.asset.chain === 'BCH');
      },
      (err) => console.error('error fetching pools:', err)
    );
  }

  formDisabled(): boolean {

    return !this.balances || !this.runeAmount || !this.assetAmount || this.insufficientBnb || this.ethContractApprovalRequired
    || (this.balances
      && (this.runeAmount > this.runeBalance || this.assetAmount > this.userService.maximumSpendableBalance(this.asset, this.assetBalance))
    );
  }

  async getMaximumSpendableEth() {
    if (this.asset && this.user && this.assetBalance) {
      this.maximumSpendableEth = await this.ethUtilsService.maximumSpendableBalance({
        asset: this.asset,
        client: this.user.clients.ethereum,
        balance: this.assetBalance
      });
    }
  }

  mainButtonText(): string {

    if (!this.balances) {
      return 'Please connect wallet';
    } else if (this.balances && (!this.runeAmount || !this.assetAmount)) {
      return 'Enter an amount';
    } else if (this.runeAmount > this.runeBalance) {
      return 'Insufficient balance';
    } else if (this.asset.chain === 'ETH' && this.assetAmount > this.maximumSpendableEth) {
      return 'Insufficient balance';
    } else if (this.assetAmount > this.userService.maximumSpendableBalance(this.asset, this.assetBalance)) {
      return 'Insufficient balance';
    } else if (this.insufficientBnb) {
      return 'Insufficient BNB for Fee';
    } else if (this.runeAmount && this.assetAmount
      && (this.runeAmount <= this.runeBalance) && (this.assetAmount <= this.assetBalance)) {
      return 'Deposit';
    } else {
      console.warn('mismatch case for main button text');
      return;
    }
  }

  openConfirmationDialog() {

    const runeBasePrice = getValueOfAssetInRune(assetToBase(assetAmount(1)), this.assetPoolData).amount().div(10 ** 8).toNumber();
    const assetBasePrice = getValueOfRuneInAsset(assetToBase(assetAmount(1)), this.assetPoolData).amount().div(10 ** 8).toNumber();

    const dialogRef = this.dialog.open(
      ConfirmDepositModalComponent,
      {
        width: '50vw',
        maxWidth: '420px',
        minWidth: '260px',
        data: {
          asset: this.asset,
          rune: this.rune,
          assetAmount: this.assetAmount,
          runeAmount: this.runeAmount,
          user: this.user,
          runeBasePrice,
          assetBasePrice
        }
      }
    );

    dialogRef.afterClosed().subscribe( (transactionSuccess: boolean) => {

      if (transactionSuccess) {
        this.assetAmount = 0;
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
