

export type WalletType = 'keystore' | 'walletconnect' | 'ledger';
import { Client as binanceClient } from '@xchainjs/xchain-binance';
import { Client as bitcoinClient } from '@xchainjs/xchain-bitcoin';
import { Balances } from '@xchainjs/xchain-client';

interface AvailableClients {
  binance?: binanceClient;
  bitcoin?: bitcoinClient;
}

export class User {
  type: WalletType;
  wallet: string; // Address
  keystore?: any;
  clients: AvailableClients;

  // for Ledger
  ledger?: any;
  hdPath?: number [];
  balances: Balances;
  // walletConnector?: FixmeType;

  constructor(user: {type: WalletType, wallet: string, keystore?: any, ledger?: any, hdPath?: number[], clients: AvailableClients}) {
    this.type = user.type;
    this.wallet = user.wallet;
    this.keystore = user.keystore ?? null;
    this.ledger = user.ledger ?? null;
    this.hdPath = user.hdPath ?? null;
    this.clients = user.clients;

    // this.fetchBalances();
  }

  // async fetchBalances(): Promise<void> {
  //   let balances: Balances = [];

  //   for (const [key, _value] of Object.entries(this.clients)) {
  //     const client = this.clients[key];
  //     const clientBalances = await client.getBalance();
  //     balances = [...balances, ...clientBalances];
  //   }

  //   this.balances = balances;

  // }

}
