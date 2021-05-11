import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { Asset } from '../_classes/asset';
import { PoolDTO } from '../_classes/pool';

@Injectable({
  providedIn: 'root',
})
export class ThorchainPricesService {
  private runeUsdPriceSource = new ReplaySubject<number>();
  runeUsdPrice$ = this.runeUsdPriceSource.asObservable();

  constructor() {}

  estimateRunePrice(pools: PoolDTO[]): number {
    const stableCoins = pools.filter((pool) => {
      const asset = new Asset(pool.asset);

      return (
        (asset.chain === 'ETH' && asset.ticker === 'USDT') ||
        (asset.chain === 'BNB' &&
          (asset.ticker === 'USDT' || asset.ticker === 'BUSD'))
      );
    });

    if (!stableCoins || stableCoins.length < 1) {
      return;
    }

    const sortedStableCoins = stableCoins.sort(
      (a, b) => +b.runeDepth - +a.runeDepth
    );
    return +sortedStableCoins[0].assetDepth / +sortedStableCoins[0].runeDepth;
  }
}
