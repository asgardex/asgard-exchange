import { Component, Input, OnChanges } from '@angular/core';
import { getPoolShare, PoolData, UnitData, baseAmount } from '@thorchain/asgardex-util';
import { PoolDetail } from 'src/app/_classes/pool-detail';
import { StakerPoolData } from 'src/app/_classes/staker-pool-data';

@Component({
  selector: 'app-staked-pool-list-item',
  templateUrl: './staked-pool-list-item.component.html',
  styleUrls: ['./staked-pool-list-item.component.scss']
})
export class StakedPoolListItemComponent implements OnChanges {

  expanded: boolean;

  /**
   * Stake Data
   */
  @Input() set stakeData(data: StakerPoolData) {
    this._stakeData = data;
  }
  get stakeData() {
    return this._stakeData;
  }
  _stakeData: StakerPoolData;

  /**
   * Pool Data
   */
  @Input() set poolData(data: PoolDetail) {
    this._poolData = data;
  }
  get poolData() {
    return this._poolData;
  }
  _poolData: PoolDetail;

  pooledRune: number;
  pooledAsset: number;
  poolShare: number;

  constructor() {
    this.expanded = false;
  }

  ngOnChanges() {
    this.getPoolShare();
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

  getPoolShare() {

    if (this.stakeData && this.poolData) {

      const unitData: UnitData = {
        stakeUnits: baseAmount(this.stakeData.units),
        totalUnits: baseAmount(this.poolData.poolUnits)
      };

      const poolData: PoolData = {
        assetBalance: baseAmount(this.poolData.assetDepth),
        runeBalance: baseAmount(this.poolData.runeDepth)
      };

      const poolShare = getPoolShare(unitData, poolData);

      this.pooledRune = poolShare.rune.amount().div(10 ** 8).toNumber();
      this.pooledAsset = poolShare.asset.amount().div(10 ** 8).toNumber();
      this.poolShare = Number(this.stakeData.units) / Number(this.poolData.poolUnits);

    }

  }

}
