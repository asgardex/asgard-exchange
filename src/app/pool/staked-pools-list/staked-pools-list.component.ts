import { Component, Input, OnInit } from '@angular/core';
import { PoolDetail } from 'src/app/_classes/pool-detail';
import { StakerPoolData } from 'src/app/_classes/staker-pool-data';

@Component({
  selector: 'app-staked-pools-list',
  templateUrl: './staked-pools-list.component.html',
  styleUrls: ['./staked-pools-list.component.scss']
})
export class StakedPoolsListComponent implements OnInit {

  @Input() stakedPools: StakerPoolData[];
  @Input() poolsData: {
    [key: string]: PoolDetail
  };

  constructor() { }

  ngOnInit(): void { }

}
