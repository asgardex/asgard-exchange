import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { User } from '../_classes/user';
import {
  Client as binanceClient,
  BinanceClient,
  Balance,
} from '@thorchain/asgardex-binance';
import {
  tokenAmount,
} from '@thorchain/asgardex-token';
import { Market, MarketResponse } from '../_classes/market';
import { bnOrZero, bn } from '@thorchain/asgardex-util';
import { AssetBalance } from '../_classes/asset-balance';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userSource = new BehaviorSubject<User>(null);
  user$ = this.userSource.asObservable();

  private marketsSource = new BehaviorSubject<Market[]>([]);
  markets$ = this.marketsSource.asObservable();

  private userBalancesSource = new BehaviorSubject<AssetBalance[]>(null);
  userBalances$ = this.userBalancesSource.asObservable();

  private pendingTransactionSource = new Subject<string>();
  pendingTransaction$ = this.pendingTransactionSource.asObservable();

  asgardexBncClient: BinanceClient;

  constructor() {
    this.asgardexBncClient = new binanceClient({
      network: 'testnet',
    });
    // this.setMarkets();
  }

  setUser(user: User) {
    this.getBalance(user.wallet);
    this.userSource.next(user);
  }

  setPendingTransaction(txId: string) {
    this.pendingTransactionSource.next(txId);
  }

  async setMarkets() {
    const res: MarketResponse = await this.asgardexBncClient.getMarkets({});

    if (res.status === 200) {

      const markets = res.result.map( (dto) => new Market(dto) );
      console.log('markets are: ', markets);

      this.marketsSource.next(markets);
    }

  }

  async getMarkets(): Promise<Market[]> {
    const res: MarketResponse = await this.asgardexBncClient.getMarkets({});

    if (res.status === 200) {

      const markets = res.result.map( (dto) => new Market(dto) );
      console.log('markets are: ', markets);

      return markets;
    }
  }

  async getBalance(address: string) {

    try {

      const balances = await this.asgardexBncClient.getBalance(address);

      const filteredBalance = balances.filter(
        (balance: Balance) => !this.isBEP8Token(balance.symbol),
      );

      const markets = await this.getMarkets();

      const coins = filteredBalance.map((coin: Balance) => {
        const market = markets.find(
          (m: Market) => m.baseAssetSymbol === coin.symbol,
        );
        return {
          asset: coin.symbol,
          assetValue: tokenAmount(coin.free),
          price: market ? bnOrZero(market.listPrice) : bn(0),
        } as AssetBalance;
      });

      this.userBalancesSource.next(coins);

    } catch (error) {
      // yield put(actions.refreshBalanceFailed(error));
      console.log('error getting balance: ', error);
    }

  }

  /** check if symbol is BEP-8 mini-BEP2 token
   * return true or false
   */
  private isBEP8Token(symbol: string): boolean {
    if (symbol) {
      const symbolSuffix = symbol.split('-')[1];
      if (
        symbolSuffix &&
        symbolSuffix.length === 4 &&
        symbolSuffix[symbolSuffix.length - 1] === 'M'
      ) {
        return true;
      }
      return false;
    }
    return false;
  }


}


