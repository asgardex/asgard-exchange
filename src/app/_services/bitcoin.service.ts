import { Injectable } from '@angular/core';
import { Client as bitcoinClient } from '@xchainjs/xchain-bitcoin';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BitcoinService {

  bitcoinClient;

  constructor() {
    const isTestnet = environment.network === 'testnet';
    this.bitcoinClient = new bitcoinClient({
      network: (isTestnet) ? 'testnet' : 'mainnet',
      nodeUrl: (isTestnet) ? 'https://api.blockchair.com/bitcoin/testnet' : 'https://api.blockchair.com/bitcoin',
      nodeApiKey: 'A___QJPUZs1cbpbK2wkKeiQoixbFnxwg'
    });
  }
}
