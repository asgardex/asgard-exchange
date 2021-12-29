import { Component, Input } from '@angular/core';
import {
  Asset,
  assetIsChainAsset,
  getChainAsset,
} from 'src/app/_classes/asset';

@Component({
  selector: 'app-icon-ticker',
  templateUrl: './icon-ticker.component.html',
  styleUrls: ['./icon-ticker.component.scss'],
})
export class IconTickerComponent {
  @Input() set asset(asset: Asset) {
    this._asset = asset;
    if (asset) {
      this.isChainAsset = assetIsChainAsset(asset);
      this.chainAsset = getChainAsset({
        chain: asset.chain,
        isSynth: asset.isSynth,
      });
    }
  }
  get asset(): Asset {
    return this._asset;
  }
  _asset: Asset;
  isChainAsset: boolean;
  chainAsset: Asset;

  constructor() {}
}
