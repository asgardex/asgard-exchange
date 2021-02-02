import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExplorerPathsService {

  binanceExplorerUrl: string;
  bitcoinExplorerUrl: string;
  thorchainExplorerUrl: string;

  constructor() {
    this.binanceExplorerUrl = environment.network === 'testnet'
      ? 'https://testnet-explorer.binance.org'
      : 'https://explorer.binance.org';
    this.bitcoinExplorerUrl = environment.network === 'testnet'
      ? 'https://blockstream.info/testnet'
      : 'https://blockstream.info';

    // this.thorchainExplorerUrl = environment.network === 'testnet'
    //   ? 'https://multichain-testnet.thorchain.net'
    //   : 'https://thorchain.net';

    this.thorchainExplorerUrl = environment.network === 'testnet'
      ? 'https://main.d3mbd42yfy75lz.amplifyapp.com/#' // flutter web beta
      : 'https://thorchain.net';

  }
}
