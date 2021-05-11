import { Asset } from './asset';

export interface StakerPoolDataDTO {
  asset: string;
  units: string;
  assetStaked: string;
  assetWithdrawn: string;
  runeStaked: string;
  runeWithdrawn: string;
  dateFirstStaked: number;
  heightLastStaked: number;
}

export class StakerPoolData {
  asset: Asset;
  units: string;
  assetStaked: string;
  assetWithdrawn: string;
  runeStaked: string;
  runeWithdrawn: string;
  dateFirstStaked: number;
  heightLastStaked: number;

  constructor(dto: StakerPoolDataDTO) {
    this.asset = new Asset(dto.asset);
    this.units = dto.units;
    this.dateFirstStaked = dto.dateFirstStaked;
    this.heightLastStaked = dto.heightLastStaked;
    this.assetStaked = dto.assetStaked;
    this.runeStaked = dto.runeStaked;
  }
}
