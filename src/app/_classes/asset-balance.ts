
import BigNumber from 'bignumber.js';
import { TokenAmount } from '@thorchain/asgardex-token';

export interface AssetBalance {
  asset: string;
  assetValue: TokenAmount;
  price: BigNumber;
}
