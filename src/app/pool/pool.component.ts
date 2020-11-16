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

  user: User;
  stakedPools: StakerPoolData[];
  poolDetailIndex: {
    [key: string]: PoolDetail
  };
  pools: string[];
  userPoolError: boolean;
  subs: Subscription[];
  loading: boolean;

  constructor(private userService: UserService, private midgardService: MidgardService) {

    this.subs = [];

    const user$ = this.userService.user$.subscribe(
      async (user) => {
        this.user = user;
        this.getAccountPools();
      }
    );

    this.subs.push(user$);

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

  async getAccountPools() {
    this.loading = true;
    this.stakedPools = [];

    if (this.user) {

      const client = this.user.clients.binance; // only need to query binance bc all pools are balanced by RUNE
      const address = await client.getAddress();

      this.midgardService.getStaker(address).subscribe(
        (res) => {
          this.userPoolError = false;

          if (res.poolsArray && res.poolsArray.length > 0) {
            this.getAccountStaked(res.poolsArray, address);
            this.getPoolData(res.poolsArray);
          } else {
            this.stakedPools = [];
            this.poolDetailIndex = {};
          }

          this.loading = false;

        },
        (err) => {
          this.userPoolError = true;
          this.loading = false;
          console.error('error fetching account pool: ', err);
        }
      );


    }

  }

  getPoolData(assets: string[]) {
    this.midgardService.getPoolDetails(assets, 'simple').subscribe(
      (res) => {

        if (!this.poolDetailIndex) {
          this.poolDetailIndex = {};
        }

        for (const poolData of res) {
          this.poolDetailIndex[poolData.asset] = poolData;
        }

      },
      (err) => {
        console.error('error fetching pool data: ', err);
        this.userPoolError = true;
      }
    );
  }

  getAccountStaked(assets: string[], address: string) {

    if (this.user) {

      this.midgardService.getStakerPoolData(address, assets).subscribe(
        (res) => {
          const stakedPools = res.map( (poolDTO) => new StakerPoolData(poolDTO) );
          this.stakedPools = [...this.stakedPools, ...stakedPools];
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
