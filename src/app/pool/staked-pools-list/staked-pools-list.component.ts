import { Component, Input, OnInit } from '@angular/core';
import { MemberPool } from 'src/app/_classes/member';
import { PoolDTO } from 'src/app/_classes/pool';
import { PoolDetail } from 'src/app/_classes/pool-detail';
import { StakerPoolData } from 'src/app/_classes/staker-pool-data';

@Component({
  selector: 'app-staked-pools-list',
  templateUrl: './staked-pools-list.component.html',
  styleUrls: ['./staked-pools-list.component.scss']
})
export class StakedPoolsListComponent implements OnInit {

  // @Input() stakedPools: StakerPoolData[];
  // @Input() poolsData: {
  //   [key: string]: PoolDetail
  // };

  @Input() set pools(pools: PoolDTO[]) {
    this._pools = pools;
    this.mapPools();
  }
  get pools() {
    return this._pools;
  }
  _pools: PoolDTO[];

  @Input() set memberPools(memberPools: MemberPool[]) {
    this._memberPools = memberPools;
    this.mapPools();
  }
  get memberPools() {
    return this._memberPools;
  }
  _memberPools: MemberPool[];

  mappedPools: {
    poolData: PoolDTO,
    memberData: MemberPool
  }[];

  constructor() { }

  ngOnInit(): void { }

  mapPools() {

    if (this.pools && this.memberPools) {
      this.mappedPools = this.memberPools.map( (memberPool) => {
        return {
          poolData: this.pools.find( (pool) => pool.asset === memberPool.pool ),
          memberData: memberPool
        };
      });
    }

  }

}
