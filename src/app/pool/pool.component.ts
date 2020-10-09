import { Component, OnDestroy, OnInit } from '@angular/core';
import { of, Subject, Subscription, timer } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { PoolDetail } from '../_classes/pool-detail';
import { StakerDTO } from '../_classes/staker';
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
  killPolling: Subject<void> = new Subject();
  subs: Subscription[];
  loading: boolean;

  constructor(private userService: UserService, private midgardService: MidgardService) {

    this.subs = [];

    const user$ = this.userService.user$.subscribe(
      (user) => {
        this.user = user;
        if (this.user) {
          this.pollAccountPools();
        } else {
          this.killPolling.next();
        }

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

  pollAccountPools(): void {

    const poll$ = timer(0, 15000)
    .pipe(
      // This kills the request if the user closes the component
      takeUntil(this.killPolling),
      // switchMap cancels the last request, if no response have been received since last tick
      switchMap(() => {
        this.loading = true;
        return this.midgardService.getStaker(this.user.wallet);
      }),
      // catchError handles http throws
      catchError(error => of(error))
    ).subscribe( (res: StakerDTO) => {

      this.userPoolError = false;

      if (res.poolsArray && res.poolsArray.length > 0) {
        this.getAccountStaked(res.poolsArray);
        this.getPoolData(res.poolsArray);
      } else {
        this.stakedPools = [];
        this.poolDetailIndex = {};
      }

      // for user to see that UI is auto refreshing
      setTimeout(() => {
        this.loading = false;
      }, 1000);

    },
    (err) => {
      this.userPoolError = true;
      this.loading = false;
      console.error('error fetching account pool: ', err);
    });
    this.subs.push(poll$);
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

  getAccountStaked(assets: string[]) {

    if (this.user) {

      this.midgardService.getStakerPoolData(this.user.wallet, assets).subscribe(
        (res) => {

          if (!this.stakedPools) {
            this.stakedPools = [];
          }

          let remainingPoolData = res;
          this.stakedPools = this.stakedPools.map( (pool) => {
            const match = remainingPoolData.find( (resPool) => {
              return `${pool.asset.chain}.${pool.asset.symbol}` === resPool.asset;
            });

            if (match) {
              remainingPoolData = remainingPoolData.filter( (remainingPool) => remainingPool.asset !== match.asset );
              pool.assetStaked = match.assetStaked;
              pool.assetWithdrawn = match.assetWithdrawn;
              pool.dateFirstStaked = match.dateFirstStaked;
              pool.heightLastStaked = match.heightLastStaked;
              pool.runeStaked = match.runeStaked;
              pool.runeWithdrawn = match.runeWithdrawn;
              pool.units = match.units;
              return pool;
            } else {
              return null;
            }

          }).filter( (pool) => pool ); // filter out null (removed pools)

          for (const remainingPool of remainingPoolData) {
            this.stakedPools.push(new StakerPoolData(remainingPool));
          }

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

    this.killPolling.next();
  }

}
