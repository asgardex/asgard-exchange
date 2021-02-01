import { BaseAmount } from '@xchainjs/xchain-util';

export type FeeType =
  | 'submit_proposal'
  | 'deposit'
  | 'vote'
  | 'create_validator'
  | 'remove_validator'
  | 'dexList'
  | 'orderNew'
  | 'orderCancel'
  | 'issueMsg'
  | 'mintMsg'
  | 'tokensBurn'
  | 'tokensFreeze'
  | 'send'
  | 'timeLock'
  | 'timeUnlock'
  | 'timeRelock'
  | 'setAccountFlags'
  | 'HTLT'
  | 'depositHTLT'
  | 'claimHTLT'
  | 'refundHTLT';


export type DexFeeName =
  | 'ExpireFee'
  | 'ExpireFeeNative'
  | 'CancelFee'
  | 'CancelFeeNative'
  | 'FeeRate'
  | 'FeeRateNative'
  | 'IOCExpireFee'
  | 'IOCExpireFeeNative';

export interface DexFee {
  fee_name: DexFeeName;
  fee_value: number;
}

export interface DexFees {
  dex_fee_fields: DexFee[];
}

export interface Fee {
  msg_type: FeeType;
  fee: number;
  fee_for: number;
}

/**
 * Fees of Transfers
 * https://docs.binance.org/trading-spec.html#fees
 */
export interface TransferFees {
  /**
   * Fee of a transfer to a single address
   */
  single: BaseAmount;
  /**
   * Multi send fee to muliple addresses
   * If the count of output address is bigger than the threshold, currently it's 2,
   * then the total transaction fee is 0.0003 BNB per token per address.
   * https://docs.binance.org/trading-spec.html#multi-send-fees
   */
  multi: BaseAmount; // multi
}
