import { AssetAmount } from '@xchainjs/xchain-util';
import { Asset } from './asset';

export type AssetAndBalance = {
  asset: Asset;
  balance?: AssetAmount;
  assetPriceUSD?: number;
};
