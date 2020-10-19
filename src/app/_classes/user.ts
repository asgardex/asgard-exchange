

export type WalletType = 'keystore' | 'walletconnect' | 'ledger';

export class User {
  type: WalletType;
  wallet: string; // Address
  keystore?: any;

  // for Ledger
  ledger?: any;
  hdPath?: number [];
  // walletConnector?: FixmeType;

  constructor(user: {type: WalletType, wallet: string, keystore?: any, ledger?: any, hdPath?: number[]}) {
    this.type = user.type;
    this.wallet = user.wallet;
    this.keystore = user.keystore ?? null;
    this.ledger = user.ledger ?? null;
    this.hdPath = user.hdPath ?? null;
  }

}
