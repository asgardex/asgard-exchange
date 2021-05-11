export enum PoolDetailStatusEnum {
  Bootstrapped = 'bootstrapped',
  Enabled = 'enabled',
  Disabled = 'disabled',
}

export interface PoolDetail {
  asset?: string;
  assetDepth?: string;
  assetROI?: string;
  assetStakedTotal?: string;
  buyAssetCount?: string;
  buyFeeAverage?: string;
  buyFeesTotal?: string;
  buySlipAverage?: string;
  buyTxAverage?: string;
  buyVolume?: string;
  poolDepth?: string;
  poolFeeAverage?: string;
  poolFeesTotal?: string;
  poolROI?: string;
  poolROI12?: string;
  poolSlipAverage?: string;
  poolStakedTotal?: string;
  poolTxAverage?: string;
  poolUnits?: string;
  poolVolume?: string;
  poolVolume24hr?: string;
  price?: string;
  runeDepth?: string;
  runeROI?: string;
  runeStakedTotal?: string;
  sellAssetCount?: string;
  sellFeeAverage?: string;
  sellFeesTotal?: string;
  sellSlipAverage?: string;
  sellTxAverage?: string;
  sellVolume?: string;
  stakeTxCount?: string;
  stakersCount?: string;
  stakingTxCount?: string;
  status?: PoolDetailStatusEnum;
  swappersCount?: string;
  swappingTxCount?: string;
  withdrawTxCount?: string;
}
