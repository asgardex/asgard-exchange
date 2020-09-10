
import BigNumber from 'bignumber.js';
import { TokenAmount } from '@thorchain/asgardex-token';

export interface AssetData {
  asset: string;
  assetValue: TokenAmount;
  price: BigNumber;
}
