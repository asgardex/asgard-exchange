import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExplorerPathsService {

  binanceExplorerUrl: string;
  bitcoinExplorerUrl: string;

  constructor() {
    this.binanceExplorerUrl = environment.network === 'testnet'
      ? 'https://testnet-explorer.binance.org'
      : 'https://explorer.binance.org';
    this.bitcoinExplorerUrl = environment.network === 'testnet'
      ? 'https://blockstream.info/testnet'
      : 'https://blockstream.info';
  }
}
