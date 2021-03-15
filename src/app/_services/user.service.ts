import { Injectable } from '@angular/core';
import { AvailableClients, User } from '../_classes/user';
import {
  Client as BinanceClient,
} from '@thorchain/asgardex-binance';
import { environment } from 'src/environments/environment';
import { Asset, checkSummedAsset } from '../_classes/asset';
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

  private userBalancesSource = new BehaviorSubject<Balances>(null);
  userBalances$ = this.userBalancesSource.asObservable();

  private killRunePolling: Subject<void> = new Subject();

  asgardexBncClient: BinanceClient;

  constructor(private midgardService: MidgardService) {

    this.asgardexBncClient = new BinanceClient({
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

  async fetchBalances(): Promise<void> {
    let balances: Balances = [];

    for (const [key, _value] of Object.entries(this._user.clients)) {

      let clientBalances;

      if (key === 'binance') {

        const client = this._user.clients.binance;
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

        const client = this._user.clients.ethereum;

        // ETH
        clientBalances = await client.getBalance();

        const ethAddress = await client.getAddress();
        const assetsToQuery: {chain: Chain, ticker: string, symbol: string}[] = [];

        /**
         * Add ETH RUNE
         */
        assetsToQuery.push(
          (environment.network === 'testnet')
          ? new Asset(`ETH.RUNE-${'0xd601c6A3a36721320573885A8d8420746dA3d7A0'}`)
          : new Asset(`ETH.RUNE-${'0x3155BA85D5F96b2d030a4966AF206230e46849cb'}`)
        );

        /**
         * Check user balance for tokens that have existing THORChain pools
         */
        const pools = await this.midgardService.getPools().toPromise();
        const ethTokenPools = pools.filter( (pool) => pool.asset.indexOf('ETH') === 0)
          .filter( (ethPool) => ethPool.asset.indexOf('-') >= 0 );

        for (const token of ethTokenPools) {
          const tokenAsset = checkSummedAsset(token.asset);
          assetsToQuery.push(tokenAsset);
        }

        /**
         * Check localstorage for user-added tokens
         */
        const userAddedTokens: string[] = JSON.parse(localStorage.getItem(`${ethAddress}_user_added`)) || [];
        for (const token of userAddedTokens) {
          const tokenAsset = checkSummedAsset(token);
          assetsToQuery.push(tokenAsset);
        }

        console.log('assetsToQuery: ', assetsToQuery);

        const tokenBalances = await client.getBalance(ethAddress, assetsToQuery);
        clientBalances.push(...tokenBalances);

      } else {
        const client = this._user.clients[key];
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
      const match = balances.find( (balance) => `${balance.asset.chain}.${balance.asset.symbol}`.toUpperCase() === `${asset.chain}.${asset.symbol}`.toUpperCase() );

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
      balMap[`${item.asset.chain}.${item.asset.symbol}`.toUpperCase()] = item;
    });

    marketListItems = marketListItems.map((mItem) => {

      if (balMap[`${mItem.asset.chain}.${mItem.asset.symbol}`.toUpperCase()]) {
        return {
          asset: mItem.asset,
          balance: baseToAsset(balMap[`${mItem.asset.chain}.${mItem.asset.symbol}`.toUpperCase()].amount),
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

      case 'BCH':
        const bchClient = clients.bitcoinCash;
        const address = await bchClient.getAddress();

        // bch testnet addresses look like bchtest:qpmhkjgp89d8uuyl3je5gw09kgsr5t4ndyj9mzvrcm
        // the colon interferes with the THORChain memo, and needs to be removed
        return address.indexOf(':') > 0 ? address.split(':')[1] : address;

      case 'ETH':
        const ethClient = clients.ethereum;
        return await ethClient.getAddress();

      case 'LTC':
        const litcoinClient = clients.litecoin;
        return await litcoinClient.getAddress();

      case 'THOR':
        const thorClient = clients.thorchain;
        return await thorClient.getAddress();

      default:
        console.error(`${chain} does not match getting token address`);
        return;
    }
  }


}


