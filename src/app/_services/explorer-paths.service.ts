import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ExplorerPathsService {
  binanceExplorerUrl: string;
  bitcoinExplorerUrl: string;
  bchExplorerUrl: string;
  thorchainExplorerUrl: string;
  ethereumExplorerUrl: string;
  litecoinExplorerUrl: string;

  constructor() {
    this.binanceExplorerUrl =
      environment.network === 'testnet'
        ? 'https://testnet-explorer.binance.org'
        : 'https://explorer.binance.org';

    this.bitcoinExplorerUrl =
      environment.network === 'testnet'
        ? 'https://blockstream.info/testnet'
        : 'https://blockstream.info';

    this.thorchainExplorerUrl =
      environment.network === 'testnet'
        ? 'https://testnet.thorchain.net/#' // flutter web beta
        : 'https://thorchain.net/#';

    this.ethereumExplorerUrl =
      environment.network === 'testnet'
        ? 'https://ropsten.etherscan.io'
        : 'https://etherscan.io';

    this.litecoinExplorerUrl =
      environment.network === 'testnet'
        ? 'https://tltc.bitaps.com'
        : 'https://ltc.bitaps.com';

    this.bchExplorerUrl =
      environment.network === 'testnet'
        ? 'https://explorer.bitcoin.com/tbch'
        : 'https://explorer.bitcoin.com/bch';
  }
}
