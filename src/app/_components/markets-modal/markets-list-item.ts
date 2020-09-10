import { CoinIconsFromTrustWallet } from 'src/app/_const/icon-list';

export interface Asset {
  chain: string;
  symbol: string;
  ticker: string;
}

export const getAssetFromString = (s?: string): Asset => {
  let chain;
  let symbol;
  let ticker;
  // We still use this function in plain JS world,
  // so we have to check the type of s here...
  if (s && typeof s === 'string') {
    const data = s.split('.');
    if (s.includes('.')) {
      chain = data[0];
      symbol = data[1];
    } else {
      symbol = data[0];
    }
    if (symbol) {
      ticker = symbol.split('-')[0];
    }
  }
  return { chain, symbol, ticker };
};

export class MarketListItem {

  asset: Asset;
  iconPath: string;

  constructor(poolName: string) {
    this.asset = this.getAssetFromString(poolName);

    const trustWalletMatch = CoinIconsFromTrustWallet[this.asset.ticker];
    console.log('trust wallet match is: ', trustWalletMatch);
    if (trustWalletMatch) {
      this.iconPath = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/${trustWalletMatch}/logo.png`;
    }

  }

  getAssetFromString(poolName: string): Asset{
    let chain;
    let symbol;
    let ticker;

    const data = poolName.split('.');
    if (poolName.includes('.')) {
      chain = data[0];
      symbol = data[1];
    } else {
      symbol = data[0];
    }
    if (symbol) {
      ticker = symbol.split('-')[0];
    }

    return { chain, symbol, ticker };
  }

}
