import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  BinanceClient,
  Client as binanceClient,
} from '@thorchain/asgardex-binance';

@Injectable({
  providedIn: 'root',
})
export class BinanceService {
  private _baseUrl: string;
  private _asgardexBncClient: BinanceClient;

  get bncClient() {
    return this._asgardexBncClient.getBncClient();
  }

  constructor(private http: HttpClient) {
    this._baseUrl =
      environment.network === 'testnet'
        ? 'https://testnet-dex.binance.org/api/v1'
        : 'https://dex.binance.org/api/v1';

    this._asgardexBncClient = new binanceClient({
      network: environment.network === 'testnet' ? 'testnet' : 'mainnet',
    });
  }

  setBinanceClient(phrase: string) {
    // this.binanceClient = new binanceClient()
    this._asgardexBncClient = new binanceClient({
      network: environment.network === 'testnet' ? 'testnet' : 'mainnet',
      phrase,
    });
  }

  getPrefix() {
    if (this._asgardexBncClient) {
      return this._asgardexBncClient.getPrefix();
    } else {
      console.error('this._asgardexBncClient not set');
    }
  }

  getTx(hash: string) {
    const params = new HttpParams().set('format', 'json');
    return this.http.get(`${this._baseUrl}/tx/${hash}`, { params });
  }
}
