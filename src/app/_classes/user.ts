

export type WalletType = 'keystore' | 'walletconnect' | 'ledger';
import { Client as binanceClient } from '@xchainjs/xchain-binance';
import { Client as bitcoinClient } from '@xchainjs/xchain-bitcoin';
import { Client as thorchainClient } from '@xchainjs/xchain-thorchain';
import { Balances } from '@xchainjs/xchain-client';

export interface AvailableClients {
  binance?: binanceClient;
  bitcoin?: bitcoinClient;
  thorchain?: thorchainClient;
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
  }

}
