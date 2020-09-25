import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PoolDetail } from '../_classes/pool-detail';
import { StakerPoolData } from '../_classes/staker-pool-data';
import { User } from '../_classes/user';
import { MidgardService } from '../_services/midgard.service';
import { UserService } from '../_services/user.service';

@Component({
  selector: 'app-pool',
  templateUrl: './pool.component.html',
  styleUrls: ['./pool.component.scss']
})
export class PoolComponent implements OnInit, OnDestroy {

  subs: Subscription[];
  user: User;
  stakedPools: StakerPoolData[];
  poolDetailIndex: {
    [key: string]: PoolDetail
  };
  pools: string[];
  userPoolError: boolean;

  constructor(private userService: UserService, private midgardService: MidgardService) {

    const user$ = this.userService.user$.subscribe(
      (user) => {
        this.user = user;
        if (this.user) {
          this.getAccountPools();
        }

      }
    );

    this.subs = [user$];

  }

  ngOnInit(): void {
    this.getPools();
  }

  getPools() {
    this.midgardService.getPools().subscribe(
      (res) => {
        this.pools = res;
      }
    );
  }

  getAccountPools() {

    this.userPoolError = false;

    if (this.user) {
      this.midgardService.getStaker(this.user.wallet).subscribe(
        (res) => {
          console.log('get account pools are: ', res);
          if (res.poolsArray && res.poolsArray.length > 0) {
            this.getAccountStaked(res.poolsArray);
            this.getPoolData(res.poolsArray);
          } else {
            this.stakedPools = [];
            this.poolDetailIndex = {};
          }

        },
        (err) => {
          console.error('error fetching account pools: ', err);
          this.userPoolError = true;
        }
      );
    }

  }

  getPoolData(assets: string[]) {
    this.midgardService.getPoolDetails(assets).subscribe(
      (res) => {
        console.log('pool data is: ', res);
        this.poolDetailIndex = {};

        for (const poolData of res) {
          this.poolDetailIndex[poolData.asset] = poolData;
        }

        console.log('pool detail index is: ', this.poolDetailIndex);

      },
      (err) => {
        console.error('error fetching pool data: ', err);
        this.userPoolError = true;
      }
    );
  }

  getAccountStaked(assets: string[]) {

    if (this.user) {

      this.stakedPools = null;

      this.midgardService.getStakerPoolData(this.user.wallet, assets).subscribe(
        (res) => {
          this.stakedPools = res.map( (dto) => new StakerPoolData(dto) );
        },
        (err) => {
          console.error('error fetching pool staker data: ', err);
          this.userPoolError = true;
        }
      );

    }

  }

  ngOnDestroy(): void {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
