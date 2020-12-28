import { Component, Input, OnChanges } from '@angular/core';
import { getPoolShare, PoolData, UnitData, baseAmount } from '@thorchain/asgardex-util';
import { Asset } from 'src/app/_classes/asset';
import { MemberPool } from 'src/app/_classes/member';
import { PoolDTO } from 'src/app/_classes/pool';
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
   * Member Pool Data
   */
  @Input() set memberPoolData(data: MemberPool) {
    this._memberPoolData = data;
  }
  get memberPoolData() {
    return this._memberPoolData;
  }
  _memberPoolData: MemberPool;

  /**
   * Pool Data
   */
  @Input() set poolData(data: PoolDTO) {
    this._poolData = data;
    this.setAsset();
  }
  get poolData() {
    return this._poolData;
  }
  _poolData: PoolDTO;

  pooledRune: number;
  pooledAsset: number;
  poolShare: number;

  asset: Asset;

  constructor() {
    this.expanded = false;
  }

  ngOnChanges() {
    this.getPoolShare();
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

  setAsset(): void {
    if (this.poolData) {
      this.asset = new Asset(this.poolData.asset);
    }
  }

  getPoolShare(): void {

    if (this.memberPoolData && this.poolData) {

      const unitData: UnitData = {
        stakeUnits: baseAmount(this.memberPoolData.liquidityUnits),
        totalUnits: baseAmount(this.poolData.units)
      };

      const poolData: PoolData = {
        assetBalance: baseAmount(this.poolData.assetDepth),
        runeBalance: baseAmount(this.poolData.runeDepth)
      };

      const poolShare = getPoolShare(unitData, poolData);

      this.pooledRune = poolShare.rune.amount().div(10 ** 8).toNumber();
      this.pooledAsset = poolShare.asset.amount().div(10 ** 8).toNumber();
      this.poolShare = Number(this.memberPoolData.liquidityUnits) / Number(this.poolData.units);

    }

  }

}
