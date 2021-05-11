import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { decryptFromKeystore } from '@xchainjs/xchain-crypto';
import { User } from '../_classes/user';
import { Client as binanceClient } from '@xchainjs/xchain-binance';
import { Client as bitcoinClient } from '@xchainjs/xchain-bitcoin';
import { Client as thorchainClient } from '@xchainjs/xchain-thorchain';
import { Client as ethereumClient } from '@xchainjs/xchain-ethereum/lib';
import { Client as litecoinClient } from '@xchainjs/xchain-litecoin';
import { Client as bitcoinCashClient } from '@xchainjs/xchain-bitcoincash';

@Injectable({
  providedIn: 'root',
})
export class KeystoreService {
  constructor() {}

  async unlockKeystore(keystore, password: string): Promise<User> {
    const phrase = await decryptFromKeystore(keystore, password);
    const network = environment.network === 'testnet' ? 'testnet' : 'mainnet';
    const userBinanceClient = new binanceClient({ network, phrase });
    const userBtcClient = new bitcoinClient({
      network,
      phrase,
      sochainUrl: 'https://sochain.com/api/v2',
      blockstreamUrl: 'https://blockstream.info',
    });
    const userThorchainClient = new thorchainClient({ network, phrase });
    const thorAddress = await userThorchainClient.getAddress();
    const userEthereumClient = new ethereumClient({
      network,
      phrase,
      etherscanApiKey: environment.etherscanKey,
      infuraCreds: { projectId: environment.infuraProjectId },
    });
    const userLtcClient = new litecoinClient({ network, phrase });
    const userbchClient = new bitcoinCashClient({ network, phrase });

    return new User({
      type: 'keystore',
      wallet: thorAddress,
      keystore,
      clients: {
        binance: userBinanceClient,
        bitcoin: userBtcClient,
        bitcoinCash: userbchClient,
        thorchain: userThorchainClient,
        ethereum: userEthereumClient,
        litecoin: userLtcClient,
      },
    });
  }
}
