import { Component, OnDestroy, OnInit } from '@angular/core';
import { Balances } from '@xchainjs/xchain-client';
import { Subscription } from 'rxjs';
import { PoolDetail } from '../_classes/pool-detail';
import { StakerPoolData } from '../_classes/staker-pool-data';
import { User } from '../_classes/user';
import { MidgardService } from '../_services/midgard.service';
import { UserService } from '../_services/user.service';
import { environment } from 'src/environments/environment';
import { PoolDTO } from '../_classes/pool';
import { MemberPool } from '../_classes/member';
import { TransactionStatusService } from '../_services/transaction-status.service';

@Component({
  selector: 'app-pool',
  templateUrl: './pool.component.html',
  styleUrls: ['./pool.component.scss']
})
export class PoolComponent implements OnInit, OnDestroy {

  user: User;
  // stakedPools: StakerPoolData[];
  // poolDetailIndex: {
  //   [key: string]: PoolDetail
  // };
  pools: PoolDTO[];
  userPoolError: boolean;
  subs: Subscription[];
  loading: boolean;
  balances: Balances;
  createablePools: string[];

  memberPools: MemberPool[];

  // userPools: {
  //   poolData: PoolDTO,
  //   memberData: MemberPool
  // }[];

  constructor(private userService: UserService, private midgardService: MidgardService, private txStatusService: TransactionStatusService) {

    this.subs = [];

    const user$ = this.userService.user$.subscribe(
      (user) => {
        this.user = user;
        this.getAccountPools();
      }
    );

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {
        this.balances = balances;
        this.checkCreateableMarkets();
      }
    );

    const pendingTx$ = this.txStatusService.txs$.subscribe(
      () => {
        console.log('pendingTx GET ACCOUNT POOLS');

        // have to call this twice to break the midgard cache
        setTimeout( () => {
          this.getAccountPools();
        }, 1000);
      }
    );

    this.subs.push(user$, balances$, pendingTx$);

  }

  ngOnInit(): void {
    this.getPools();
  }

  getPools() {
    this.midgardService.getPools().subscribe(
      (res) => {
        // const poolNames = res.map( (pool) => pool.asset );
        this.pools = res;
        this.checkCreateableMarkets();
      }
    );
  }

  checkCreateableMarkets() {

    const runeSymbol = environment.network === 'chaosnet' ? 'RUNE-B1A' : 'RUNE-67C';

    if (this.pools && this.balances) {

      this.createablePools = this.balances.filter( (balance) => {
        const asset = balance.asset;
        return !this.pools.find((pool) => pool.asset === `${asset.chain}.${asset.symbol}`)
          && asset.symbol !== runeSymbol;
      }).map( (balance) => `${balance.asset.chain}.${balance.asset.symbol}` );

    }

  }

  async getAccountPools() {
    this.loading = true;
    // this.stakedPools = [];

    if (this.user) {

      const client = this.user.clients.thorchain; // only need to query binance bc all pools are balanced by RUNE
      const address = await client.getAddress();

      // this.midgardService.getStaker(address).subscribe(
      //   (res) => {
      //     this.userPoolError = false;

      //     if (res.poolsArray && res.poolsArray.length > 0) {
      //       this.getAccountStaked(res.poolsArray, address);
      //       this.getPoolData(res.poolsArray);
      //     } else {
      //       this.stakedPools = [];
      //       this.poolDetailIndex = {};
      //     }

      //     this.loading = false;

      //   },
      //   (err) => {
      //     this.userPoolError = true;
      //     this.loading = false;
      //     console.error('error fetching account pool: ', err);
      //   }
      // );

      this.midgardService.getMember(address).subscribe(
        (res) => {
          this.memberPools = res.pools;
          this.loading = false;
          // this.userPools = res.pools.map( (memberPool) => {
          //   return {
          //     poolData: this.pools.find( (pool) => pool.asset === memberPool.pool ),
          //     memberData: memberPool
          //   };
          // });
        },
        (err) => {

          if (err.status === 404) {
            this.memberPools = [];
          } else {
            this.userPoolError = true;
          }

          this.loading = false;
          console.error('error fetching account pool: ', err);
        }
      );


    }

  }

  // getPoolData(assets: string[]) {
  //   this.midgardService.getPoolDetails(assets, 'simple').subscribe(
  //     (res) => {

  //       if (!this.poolDetailIndex) {
  //         this.poolDetailIndex = {};
  //       }

  //       for (const poolData of res) {
  //         this.poolDetailIndex[poolData.asset] = poolData;
  //       }

  //     },
  //     (err) => {
  //       console.error('error fetching pool data: ', err);
  //       this.userPoolError = true;
  //     }
  //   );
  // }

  // getAccountStaked(assets: string[], address: string) {

  //   if (this.user) {

  //     this.midgardService.getStakerPoolData(address, assets).subscribe(
  //       (res) => {
  //         const stakedPools = res.map( (poolDTO) => new StakerPoolData(poolDTO) );
  //         this.stakedPools = [...this.stakedPools, ...stakedPools];
  //       },
  //       (err) => {
  //         console.error('error fetching pool staker data: ', err);
  //         this.userPoolError = true;
  //       }
  //     );

  //   }

  // }

  ngOnDestroy(): void {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
