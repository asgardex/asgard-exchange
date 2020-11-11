import { AssetAmount } from '@thorchain/asgardex-util';
import { Asset } from './asset';

export type AssetAndBalance = {
  asset: Asset,
  balance?: AssetAmount;
};
