import BigNumber from 'bignumber.js';
import { TokenAmount, BaseAmount } from '@thorchain/asgardex-token';

export interface SwapData {
  symbolFrom: string;
  symbolTo: string;
  Px: BigNumber;
  slip: BigNumber;
  outputAmount: TokenAmount;
  outputPrice: BigNumber;
  fee: TokenAmount;
  slipLimit: BaseAmount;
}
