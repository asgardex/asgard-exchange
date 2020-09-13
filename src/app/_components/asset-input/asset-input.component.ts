import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Asset } from 'src/app/_classes/asset';
import { MarketsModalComponent } from '../markets-modal/markets-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { AssetBalance } from 'src/app/_classes/asset-balance';

@Component({
  selector: 'app-asset-input',
  templateUrl: './asset-input.component.html',
  styleUrls: ['./asset-input.component.scss']
})
export class AssetInputComponent implements OnInit {

  /**
   * Wallet balances
   */
  @Input() set balances(balances: AssetBalance[]) {
    this._balances = balances;
    this.updateBalance();
  }
  get balances() {
    return this._balances;
  }
  private _balances: AssetBalance[];
  balance: number;

  /**
   * Selected Asset
   */
  @Input() set selectedAsset(asset: Asset) {
    this._selectedAsset = asset;
    this.updateBalance();
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

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
  }

  updateAssetUnits(val) {
    this.assetUnitChange.emit(val);
  }

  updateBalance() {
    if (this.balances && this.selectedAsset) {
      const match = this.balances.find( (balance) => balance.asset === this.selectedAsset.symbol );

      if (match) {
        this.balance = match.assetValue.amount().toNumber();
        console.log('selected source balance is: ', this.balance);
      } else {
        this.balance = 0.0;
      }
      console.log('match is: ', match);
    }
  }

  launchMarketsModal() {

    const dialogRef = this.dialog.open(
      MarketsModalComponent,
      {
        width: '50vw',
        maxWidth: '420px',
        data: {
          disabledAssetSymbol: this.disabledAssetSymbol
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
