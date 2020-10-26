import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExplorerPathsService {

  binanceExplorerUrl: string;
  bitcoinExplorerUrl: string;

  constructor() {
    this.binanceExplorerUrl = environment.network === 'testnet' ? 'https://testnet-explorer.binance.org/tx' : 'https://explorer.binance.org/tx';
    this.bitcoinExplorerUrl = environment.network === 'testnet'
      ? 'https://blockstream.info/testnet/tx'
      : 'https://blockstream.info/tx';
  }
}
