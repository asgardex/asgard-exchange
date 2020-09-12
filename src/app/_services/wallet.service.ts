import { Injectable } from '@angular/core';
import {
  Client as binanceClient,
  BinanceClient,
  Balance,
} from '@thorchain/asgardex-binance';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  asgardexBncClient: BinanceClient;

  get bncClient() {
    return this.asgardexBncClient.getBncClient();
  }

  constructor() {
    this.asgardexBncClient = new binanceClient({
      network: 'testnet',
    });
  }

}
