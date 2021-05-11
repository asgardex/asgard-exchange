import BigNumber from 'bignumber.js';
import { TokenAmount } from '@thorchain/asgardex-token';

// deprecate in favor of Balance from 'xchainjs'
export interface AssetBalance {
  asset: string;
  assetValue: TokenAmount;
  price: BigNumber;
}
