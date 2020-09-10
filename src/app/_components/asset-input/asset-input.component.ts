import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Balance } from '@thorchain/asgardex-binance';
import { MarketListItem } from 'src/app/_components/markets-modal/markets-list-item';
import { MarketsModalComponent } from '../markets-modal/markets-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-asset-input',
  templateUrl: './asset-input.component.html',
  styleUrls: ['./asset-input.component.scss']
})
export class AssetInputComponent implements OnInit {

  @Input() label: string;
  @Input() balances: Balance[];
  @Input() selectedAsset: MarketListItem;
  @Input() disableInput?: boolean;
  @Output() selectedAssetChange = new EventEmitter<MarketListItem>();
  @Input() assetUnit: number;
  @Output() assetUnitChange = new EventEmitter<number>();

  selectedFromBalance: number;

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
  }

  updateAssetUnits(val) {
    this.assetUnitChange.emit(val);
  }

  launchMarketsModal() {

    const dialogRef = this.dialog.open(
      MarketsModalComponent,
      {
        width: '50vw',
        maxWidth: '420px'
      }
    );

    dialogRef.afterClosed().subscribe( (result: MarketListItem) => {

      if (result) {
        this.selectedAssetChange.emit(result);
      }

    });

  }

}
