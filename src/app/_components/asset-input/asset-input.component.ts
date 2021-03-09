import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Asset } from 'src/app/_classes/asset';
import { MarketsModalComponent } from '../markets-modal/markets-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'src/app/_services/user.service';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { EthUtilsService } from 'src/app/_services/eth-utils.service';
import { User } from 'src/app/_classes/user';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-asset-input',
  templateUrl: './asset-input.component.html',
  styleUrls: ['./asset-input.component.scss']
})
export class AssetInputComponent implements OnInit, OnDestroy {

  /**
   * Selected Asset
   */
  @Input() set selectedAsset(asset: Asset) {
    this._selectedAsset = asset;
    this.checkUsdBalance();
  }
  get selectedAsset() {
    return this._selectedAsset;
  }
  @Output() selectedAssetChange = new EventEmitter<Asset>();
  private _selectedAsset: Asset;

  /**
   * Asset Unit
   */
  @Input() assetUnit: number;
  @Output() assetUnitChange = new EventEmitter<number>();

  @Input() label: string;
  @Input() disableInput?: boolean;
  @Input() disabledAssetSymbol: string;

  /**
   * Wallet balance
   */
  @Input() set balance(bal: number) {
    this._balance = bal;
    this.checkUsdBalance();
  }
  get balance() {
    return this._balance;
  }
  _balance: number;

  @Input() hideMax: boolean;

  @Input() disabledMarketSelect: boolean;
  @Input() loading: boolean;
  @Input() error: boolean;
  @Input() set selectableMarkets(markets: AssetAndBalance[]) {
    this._selectableMarkets = markets;
    this.checkUsdBalance();
  }
  get selectableMarkets() {
    return this._selectableMarkets;
  }
  _selectableMarkets: AssetAndBalance[];

  usdValue: number;
  user: User;
  subs: Subscription[];

  constructor(private dialog: MatDialog, private userService: UserService, private ethUtilsService: EthUtilsService) {
    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );
    this.subs = [user$];
  }

  ngOnInit(): void {
  }

  checkUsdBalance(): void {

    if (!this.balance || !this.selectableMarkets) {
      return;
    }

    const targetPool = this.selectableMarkets.find( (market) => `${market.asset.chain}.${market.asset.ticker}` === `${this.selectedAsset.chain}.${this.selectedAsset.ticker}` );
    if (!targetPool || !targetPool.assetPriceUSD) {
      return;
    }
    this.usdValue = targetPool.assetPriceUSD * this.balance;
  }

  updateAssetUnits(val): void {
    this.assetUnitChange.emit(val);
  }

  async setMax(): Promise<void> {

    this.loading = true;

    if (this.balance) {
      let max: number;
      if (this.selectedAsset.chain === 'ETH') {
        if (this.user && this.user.clients) {
          max = await this.ethUtilsService.maximumSpendableBalance({
            asset: this.selectedAsset,
            client: this.user.clients.ethereum,
            balance: this.balance
          });
        } else {
          console.error('no user clients found: ', this.user);
          max = 0;
        }
      } else {
        max = this.userService.maximumSpendableBalance(this.selectedAsset, this.balance);
      }

      if (max) {
        this.assetUnitChange.emit(max);
      } else {
        console.error('max undefined');
      }
    }

    this.loading = false;

  }

  launchMarketsModal(): void {

    const dialogRef = this.dialog.open(
      MarketsModalComponent,
      {
        minWidth: '260px',
        maxWidth: '420px',
        width: '50vw',
        data: {
          disabledAssetSymbol: this.disabledAssetSymbol,
          selectableMarkets: this.selectableMarkets
        }
      }
    );

    dialogRef.afterClosed().subscribe( (result: Asset) => {

      if (result) {
        this.selectedAssetChange.emit(result);
      }

    });

  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
