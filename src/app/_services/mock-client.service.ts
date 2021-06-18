import { Injectable } from '@angular/core';
import { Client as binanceClient } from '@xchainjs/xchain-binance';
import { Client as bitcoinClient } from '@xchainjs/xchain-bitcoin';
import { Client as thorchainClient } from '@xchainjs/xchain-thorchain';
import { Client as litecoinClient } from '@xchainjs/xchain-litecoin';
import { Client as bitcoinCashClient } from '@xchainjs/xchain-bitcoincash';
import { Client as ethereumClient } from '@xchainjs/xchain-ethereum/lib';
import { Chain } from '@xchainjs/xchain-util';
import { environment } from 'src/environments/environment';

/**
 * this is used for convenience methods when user is not using keystore
 */
@Injectable({
  providedIn: 'root',
})
export class MockClientService {
  MOCK_PHRASE =
    'image rally need wedding health address purse army antenna leopard sea gain';
  mockBinanceClient: binanceClient;
  mockBtcClient: bitcoinClient;
  mockThorchainClient: thorchainClient;
  mockEthereumClient: ethereumClient;
  mockLtcClient: litecoinClient;
  mockBchClient: bitcoinCashClient;

  constructor() {
    const network = environment.network === 'testnet' ? 'testnet' : 'mainnet';
    const phrase = this.MOCK_PHRASE;

    this.mockBinanceClient = new binanceClient({ network, phrase });
    this.mockBtcClient = new bitcoinClient({
      network,
      phrase,
      sochainUrl: 'https://sochain.com/api/v2',
      blockstreamUrl: 'https://blockstream.info',
    });
    this.mockThorchainClient = new thorchainClient({ network, phrase });
    this.mockEthereumClient = new ethereumClient({
      network,
      phrase,
      etherscanApiKey: environment.etherscanKey,
      infuraCreds: { projectId: environment.infuraProjectId },
    });
    this.mockLtcClient = new litecoinClient({ network, phrase });
    this.mockBchClient = new bitcoinCashClient({ network, phrase });
  }

  getMockClientByChain(chain: Chain) {
    switch (chain) {
      case 'BTC':
        return this.mockBtcClient;

      case 'ETH':
        return this.mockEthereumClient;

      case 'BNB':
        return this.mockBinanceClient;

      case 'BCH':
        return this.mockBchClient;

      case 'LTC':
        return this.mockLtcClient;

      case 'THOR':
        return this.mockThorchainClient;
    }

    throw new Error(`mock client no matching client for chain: ${chain}`);
  }
}
