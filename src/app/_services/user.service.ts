import { Injectable } from '@angular/core';
import { User } from '../_classes/user';
import {
  Client as binanceClient,
  BinanceClient,
} from '@thorchain/asgardex-binance';
import { Market, MarketResponse } from '../_classes/market';
import { environment } from 'src/environments/environment';
import { Asset } from '../_classes/asset';
import { Balance, Balances } from '@xchainjs/xchain-client';
import { BncClient } from '@binance-chain/javascript-sdk/lib/client';
import {
  assetAmount,
  assetToBase,
  assetFromString,
  baseToAsset
} from '@xchainjs/xchain-util';
import { BehaviorSubject, of, Subject, timer } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { AssetAndBalance } from '../_classes/asset-and-balance';

export interface MidgardData<T> {
  key: string;
  value: T;
  link: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private _user: User;
  private userSource = new BehaviorSubject<User>(null);
  user$ = this.userSource.asObservable();

  private marketsSource = new BehaviorSubject<Market[]>([]);
  markets$ = this.marketsSource.asObservable();

  private userBalancesSource = new BehaviorSubject<Balances>(null);
  userBalances$ = this.userBalancesSource.asObservable();

  private killRunePolling: Subject<void> = new Subject();

  asgardexBncClient: BinanceClient;

  constructor() {

    this.asgardexBncClient = new binanceClient({
      network: (environment.network) === 'testnet' ? 'testnet' : 'mainnet',
    });

  }

  setUser(user: User) {
    this._user = user;
    this.userSource.next(user);
    if (user) {
      this.fetchBalances();
    }
  }

  async setMarkets() {
    const res: MarketResponse = await this.asgardexBncClient.getMarkets({});
    if (res.status === 200) {
      const markets = res.result.map( (dto) => new Market(dto) );
      this.marketsSource.next(markets);
    }
  }

  async getMarkets(): Promise<Market[]> {
    const res: MarketResponse = await this.asgardexBncClient.getMarkets({});
    if (res.status === 200) {
      const markets = res.result.map( (dto) => new Market(dto) );
      return markets;
    }
  }

  async fetchBalances(): Promise<void> {
    let balances: Balances = [];

    for (const [key, _value] of Object.entries(this._user.clients)) {

      const client = this._user.clients[key];
      let clientBalances;

      if (key === 'binance') {
        const bncClient: BncClient = await client.getBncClient();
        const address = await client.getAddress();
        const bncBalances = await bncClient.getBalance(address);

        clientBalances = bncBalances
          .map((balance) => {

            const asset = assetFromString(`BNB.${balance.symbol}`);

            return {
              asset,
              amount: assetToBase(assetAmount(balance.free, 8)),
              frozenAmount: assetToBase(assetAmount(balance.frozen, 8)),
            };
          });
          // .filter((balance) => !asset || balance.asset === asset)

      } else {
        clientBalances = await client.getBalance();
      }
      balances = [...balances, ...clientBalances];
    }

    this.userBalancesSource.next(balances);

  }

  /**
   * Midgard has no way to tell when BNB has been successfully upgraded to RUNE
   * so we poll the native RUNE balance to check for a difference
   */
  pollNativeRuneBalance(currentBalance: number) {

    if (this._user && this._user.clients && this._user.clients.thorchain) {

      timer(5000, 15000)
      .pipe(
        // This kills the request if the user closes the component
        takeUntil(this.killRunePolling),
        // switchMap cancels the last request, if no response have been received since last tick
        // switchMap(() => this.midgardService.getTransaction(tx.hash)),
        switchMap(() => this._user.clients.thorchain.getBalance()),
        // catchError handles http throws
        catchError(error => of(error))
      ).subscribe( async (res: Balances) => {

        const runeBalance = this.findBalance(res, new Asset('THOR.RUNE'));
        if (runeBalance && currentBalance < runeBalance) {
          console.log('increased!');
          this.fetchBalances();
          this.killRunePolling.next();
        }

      });

    } else {
      console.error('no thorchain client found');
    }

  }

  maximumSpendableBalance(asset: Asset, balance: number) {

    if (asset.chain === 'BNB' && asset.symbol === 'BNB') {
      const max = balance - 0.01 - 0.000375;
      return (max >= 0) ? max : 0;
    } else if (asset.chain === 'THOR' && asset.symbol === 'RUNE') {
      const max = balance - 1;
      return (max >= 0) ? max : 0;
    } else {
      return balance;
    }

  }

  findBalance(balances: Balances, asset: Asset) {

    if (balances && asset) {
      const match = balances.find( (balance) => `${balance.asset.chain}.${balance.asset.symbol}` === `${asset.chain}.${asset.symbol}` );

      if (match) {
        return baseToAsset(match.amount).amount().toNumber();
      } else {
        return 0.0;
      }
    }
  }

  sortMarketsByUserBalance(userBalances: Balances, marketListItems: AssetAndBalance[]): AssetAndBalance[] {

    const balMap: {[key: string]: Balance} = {};
    userBalances.forEach((item) => {
      balMap[`${item.asset.chain}.${item.asset.symbol}`] = item;
    });

    marketListItems = marketListItems.map((mItem) => {

      if (balMap[`${mItem.asset.chain}.${mItem.asset.symbol}`]) {
        return {
          asset: mItem.asset,
          balance: baseToAsset(balMap[`${mItem.asset.chain}.${mItem.asset.symbol}`].amount),
        };
      }
      else {
        return {
          asset: mItem.asset,
        };
      }

    });

    marketListItems = marketListItems.sort((a, b) => {
      if (!a.balance && !b.balance) { return 0; }
      if (!a.balance) { return 1; }
      if (!b.balance) { return -1; }
      return (
        b.balance.amount().toNumber() - a.balance.amount().toNumber()
      );
    });

    return marketListItems;

  }


}


