import { Injectable } from '@angular/core';
import { Chain } from '@xchainjs/xchain-util';
import { Asset } from '../_classes/asset';

@Injectable({
  providedIn: 'root'
})
export class SynthUtilsService {

  constructor() { }

  isThorchainSynth(asset: Asset): boolean {
    return asset.chain == 'THOR' && asset.symbol !== 'RUNE';
  }

  getNativeChain(asset: Asset): string {
    const split = asset.symbol.split('/');
    return (split.length > 0) ? split[0] : '';
  }

  parseNativeAsset(asset: Asset): Asset {
    const split = asset.symbol.split('/');
    return new Asset(`${split[0]}.${split[1]}`);
  }

}
