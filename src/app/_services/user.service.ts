import { Injectable } from '@angular/core';
import { AvailableClients, User } from '../_classes/user';
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
  baseToAsset,
  Chain
} from '@xchainjs/xchain-util';
import { BehaviorSubject, of, Subject, timer } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { AssetAndBalance } from '../_classes/asset-and-balance';
import { MidgardService } from './midgard.service';
import { ethers } from 'ethers';
import * as EventEmitter from 'events';

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
  userPurge:EventEmitter = new EventEmitter();

  private marketsSource = new BehaviorSubject<Market[]>([]);
  markets$ = this.marketsSource.asObservable();

  private userBalancesSource = new BehaviorSubject<Balances>(null);
  userBalances$ = this.userBalancesSource.asObservable();

  private killRunePolling: Subject<void> = new Subject();

  asgardexBncClient: BinanceClient;

  constructor(private midgardService: MidgardService) {

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
    if (user == undefined)
      this.userPurge.emit('')
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

      } else if (key === 'ethereum') {

        // ETH
        clientBalances = await client.getBalance();

        const ethAddress = await client.getAddress();
        const assetsToQuery: Asset[] = [];

        /**
         * Add ETH RUNE
         */
        assetsToQuery.push(
          (environment.network === 'testnet')
          ? new Asset(`ETH.RUNE-${'0xd601c6A3a36721320573885A8d8420746dA3d7A0'.toUpperCase()}`)
          : new Asset(`ETH.RUNE-${'0x3155BA85D5F96b2d030a4966AF206230e46849cb'.toUpperCase()}`)
        );

        /**
         * Check user balance for tokens that have existing THORChain pools
         */
        const pools = await this.midgardService.getPools().toPromise();
        const ethTokenPools = pools.filter( (pool) => pool.asset.indexOf('ETH') === 0)
          .filter( (ethPool) => ethPool.asset.indexOf('-') >= 0 );

        for (const token of ethTokenPools) {
          assetsToQuery.push(new Asset(token.asset));
        }

        /**
         * Check localstorage for user-added tokens
         */
        const userAddedTokens = JSON.parse(localStorage.getItem(`${ethAddress}_user_added`)) || [];
        for (const token of userAddedTokens) {
          assetsToQuery.push(new Asset(token));
        }

        for (const asset of assetsToQuery) {
          const assetAddress = asset.symbol.slice(asset.ticker.length + 1);
          const strip0x = assetAddress.substr(2);
          const checkSummedAddress = ethers.utils.getAddress(strip0x);
          const tokenAsset = {chain: asset.chain, ticker: asset.ticker, symbol: `${asset.ticker}-${checkSummedAddress}`};
          const tokenBalance = await client.getBalance(ethAddress, tokenAsset);
          tokenBalance[0].asset = asset;
          clientBalances.push(...tokenBalance);
        }


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

  async getTokenAddress(user: User, chain: Chain): Promise<string> {

    const clients: AvailableClients = user.clients;

    switch (chain) {
      case 'BNB':
        const bnbClient = clients.binance;
        return await bnbClient.getAddress();

      case 'BTC':
        const btcClient = clients.bitcoin;
        return await btcClient.getAddress();

      case 'ETH':
        const ethClient = clients.ethereum;
        return await ethClient.getAddress();

      default:
        console.error(`${chain} does not match getting token address`);
        return;
    }
  }


}


