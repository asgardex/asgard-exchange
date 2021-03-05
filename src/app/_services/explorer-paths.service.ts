import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExplorerPathsService {

  binanceExplorerUrl: string;
  bitcoinExplorerUrl: string;
  thorchainExplorerUrl: string;
  ethereumExplorerUrl: string;
  litecoinExplorerUrl: string;

  constructor() {
    this.binanceExplorerUrl = environment.network === 'testnet'
      ? 'https://testnet-explorer.binance.org'
      : 'https://explorer.binance.org';

    this.bitcoinExplorerUrl = environment.network === 'testnet'
      ? 'https://blockstream.info/testnet'
      : 'https://blockstream.info';

    this.thorchainExplorerUrl = environment.network === 'testnet'
      ? 'https://main.d3mbd42yfy75lz.amplifyapp.com/#' // flutter web beta
      : 'https://thorchain.net';

    this.ethereumExplorerUrl = environment.network === 'testnet'
      ? 'https://ropsten.etherscan.io'
      : 'https://etherscan.io';


    this.litecoinExplorerUrl = environment.network === 'testnet'
      ? 'https://tltc.bitaps.com'
      : 'https://ltc.bitaps.com';

  }
}
