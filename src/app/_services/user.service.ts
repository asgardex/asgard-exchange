import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../_classes/user';
import {
  Client as binanceClient,
  BinanceClient,
} from '@thorchain/asgardex-binance';
import { Market, MarketResponse } from '../_classes/market';
import { assetAmount, baseToAsset } from '@thorchain/asgardex-util';
import { environment } from 'src/environments/environment';
import { Asset } from '../_classes/asset';
import { Balances } from '@xchainjs/xchain-client';
import { BncClient } from '@binance-chain/javascript-sdk/lib/client';
import {
  assetFromString,
  assetToBase,
} from '@thorchain/asgardex-util';

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

  maximumSpendableBalance(asset: Asset, balance: number) {

    if (asset.chain === 'BNB' && asset.symbol === 'BNB') {
      const max = balance - 0.01 - 0.000375;
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


}


