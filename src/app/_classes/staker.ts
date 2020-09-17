export class Staker {
  poolsArray: string[];
  totalEarned: number;
  totalStaked: number;
  totalROI: number;

  constructor(dto: StakerDTO) {
    this.poolsArray = dto.poolsArray;
    this.totalEarned = +dto.totalEarned;
    this.totalStaked = +dto.totalStaked;
    this.totalROI = +dto.totalROI;
  }

}

export interface StakerDTO {
  poolsArray: string[];
  totalEarned: string;
  totalStaked: string;
  totalROI: string;
}
