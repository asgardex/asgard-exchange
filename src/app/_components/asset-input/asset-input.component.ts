import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Asset } from 'src/app/_classes/asset';
import { MarketsModalComponent } from '../markets-modal/markets-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'src/app/_services/user.service';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';

@Component({
  selector: 'app-asset-input',
  templateUrl: './asset-input.component.html',
  styleUrls: ['./asset-input.component.scss']
})
export class AssetInputComponent implements OnInit {

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

  constructor(private dialog: MatDialog, private userService: UserService) {
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

  setMax(): void {

    if (this.balance) {
      const max = this.userService.maximumSpendableBalance(this.selectedAsset, this.balance);
      this.assetUnitChange.emit(max);
    }

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

}
