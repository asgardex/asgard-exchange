

export type WalletType = 'keystore' | 'walletconnect' | 'ledger';

export class User {
  type: WalletType;
  wallet: string; // Address
  keystore?: any;
  // ledger?: FixmeType;
  // hdPath?: number [];
  // walletConnector?: FixmeType;

  constructor(user: {type: WalletType, wallet: string, keystore?: any}) {
    this.type = user.type;
    this.wallet = user.wallet;
    this.keystore = user.keystore ?? null;
  }

}
