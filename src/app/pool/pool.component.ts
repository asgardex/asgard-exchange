import { Component, OnDestroy, OnInit } from '@angular/core';
import { Balances } from '@xchainjs/xchain-client';
import { combineLatest, Subscription } from 'rxjs';
import { User } from '../_classes/user';
import { MidgardService } from '../_services/midgard.service';
import { UserService } from '../_services/user.service';
import { PoolDTO } from '../_classes/pool';
import { MemberPool } from '../_classes/member';
import { TransactionStatusService } from '../_services/transaction-status.service';
import { isNonNativeRuneToken } from '../_classes/asset';

@Component({
  selector: 'app-pool',
  templateUrl: './pool.component.html',
  styleUrls: ['./pool.component.scss'],
})
export class PoolComponent implements OnInit, OnDestroy {
  user: User;
  pools: PoolDTO[];
  userPoolError: boolean;
  subs: Subscription[];
  loading: boolean;
  balances: Balances;
  createablePools: string[];
  memberPools: MemberPool[];
  addresses: string[];
  maxLiquidityRune: number;
  totalPooledRune: number;
  depositsDisabled: boolean;
  txStreamInitSuccess: boolean;

  constructor(
    private userService: UserService,
    private midgardService: MidgardService,
    private txStatusService: TransactionStatusService
  ) {
    this.subs = [];
    this.memberPools = [];
    this.depositsDisabled = false;

    const user$ = this.userService.user$.subscribe((user) => {
      this.user = user;
      this.getAccountPools();
    });

    const balances$ = this.userService.userBalances$.subscribe((balances) => {
      this.balances = balances;
      this.checkCreateableMarkets();
    });

    const pendingTx$ = this.txStatusService.txs$.subscribe((_) => {
      if (!this.txStreamInitSuccess) {
        this.txStreamInitSuccess = true;
      } else {
        setTimeout(() => {
          this.getAccountPools();
        }, 3000);
      }
    });

    this.subs.push(user$, balances$, pendingTx$);
  }

  ngOnInit(): void {
    this.getPools();
    this.getPoolCap();
  }

  getPools() {
    this.midgardService.getPools().subscribe((res) => {
      this.pools = res;
      this.checkCreateableMarkets();
    });
  }

  checkCreateableMarkets() {
    if (this.pools && this.balances) {
      this.createablePools = this.balances
        .filter((balance) => {
          const asset = balance.asset;
          return (
            !this.pools.find(
              (pool) => pool.asset === `${asset.chain}.${asset.symbol}`
            ) &&
            !isNonNativeRuneToken(asset) &&
            asset.chain !== 'THOR'
          );
        })
        .map((balance) => `${balance.asset.chain}.${balance.asset.symbol}`);
    }
  }

  getPoolCap() {
    const mimir$ = this.midgardService.getMimir();
    const network$ = this.midgardService.getNetwork();
    const combined = combineLatest([mimir$, network$]);
    const sub = combined.subscribe(([mimir, network]) => {
      // prettier-ignore
      this.totalPooledRune = +network.totalPooledRune / (10 ** 8);

      if (mimir && mimir['mimir//MAXIMUMLIQUIDITYRUNE']) {
        // prettier-ignore
        this.maxLiquidityRune = mimir['mimir//MAXIMUMLIQUIDITYRUNE'] / (10 ** 8);
        this.depositsDisabled =
          this.totalPooledRune / this.maxLiquidityRune >= 0.9;
      }
    });

    this.subs.push(sub);
  }

  async getAddresses(): Promise<string[]> {
    if (this.user && this.user.type === 'metamask') {
      return [this.user.wallet.toLowerCase()];
    } else {
      const thorClient = this.user.clients.thorchain;
      const thorAddress = await thorClient.getAddress();

      const btcClient = this.user.clients.bitcoin;
      const btcAddress = await btcClient.getAddress();

      const ltcClient = this.user.clients.litecoin;
      const ltcAddress = await ltcClient.getAddress();

      const bchClient = this.user.clients.bitcoinCash;
      const bchAddress = await bchClient.getAddress();

      const bnbClient = this.user.clients.binance;
      const bnbAddress = await bnbClient.getAddress();

      const ethClient = this.user.clients.ethereum;
      const ethAddress = await ethClient.getAddress();

      return [
        thorAddress,
        btcAddress,
        ltcAddress,
        bchAddress,
        bnbAddress,
        ethAddress,
      ];
    }
  }

  async getAccountPools() {
    this.loading = true;
    this.memberPools = [];

    if (this.user) {
      if (!this.addresses) {
        this.addresses = await this.getAddresses();
      }

      for (const address of this.addresses) {
        this.midgardService.getMember(address).subscribe((res) => {
          for (const pool of res.pools) {
            const match = this.memberPools.find(
              (existingPool) => existingPool.pool === pool.pool
            );
            if (!match) {
              const memberPools = this.memberPools;
              memberPools.push(pool);
              this.memberPools = [...memberPools];
            }
          }
        });
      }
    }

    this.loading = false;
  }

  ngOnDestroy(): void {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}
