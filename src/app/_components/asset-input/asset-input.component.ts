import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Asset } from 'src/app/_classes/asset';
import { MarketsModalComponent } from '../markets-modal/markets-modal.component';
import { MatDialog } from '@angular/material/dialog';

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
  @Input() balance: number;

  @Input() hideMax: boolean;

  @Input() disabledMarketSelect: boolean;
  @Input() loading: boolean;
  @Input() error: boolean;

  constructor(private dialog: MatDialog) {
  }

  ngOnInit(): void {
  }

  updateAssetUnits(val) {
    this.assetUnitChange.emit(val);
  }

  setMax() {

    if (this.balance) {
      this.assetUnitChange.emit(this.balance);
    }

  }

  launchMarketsModal() {

    const dialogRef = this.dialog.open(
      MarketsModalComponent,
      {
        minWidth: '260px',
        maxWidth: '420px',
        width: '50vw',
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
