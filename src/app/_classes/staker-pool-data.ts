import { Asset } from './asset';

export interface StakerPoolDataDTO {
  asset: string;
  stakeUnits: string;
  dateFirstStaked: number;
  heightLastStaked: number;
}

export class StakerPoolData {
  asset: Asset;
  stakeUnits: string;
  dateFirstStaked: number;
  heightLastStaked: number;

  constructor(dto: StakerPoolDataDTO) {

    this.asset = new Asset(dto.asset);
    this.stakeUnits = dto.stakeUnits;
    this.dateFirstStaked = dto.dateFirstStaked;
    this.heightLastStaked = dto.heightLastStaked;

  }

}
