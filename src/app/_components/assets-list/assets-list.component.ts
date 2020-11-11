import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Asset } from 'src/app/_classes/asset';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';

@Component({
  selector: 'app-assets-list',
  templateUrl: './assets-list.component.html',
  styleUrls: ['./assets-list.component.scss']
})
export class AssetsListComponent implements OnInit {

  @Input() loading: boolean;
  @Input() assetListItems: AssetAndBalance[];
  @Input() disabledAssetSymbol: string;
  @Output() selectAsset: EventEmitter<Asset>;

  constructor() {
    this.selectAsset = new EventEmitter<Asset>();
  }

  ngOnInit(): void {
  }

}
