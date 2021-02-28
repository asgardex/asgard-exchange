import { CoinIconsFromTrustWallet } from 'src/app/_const/icon-list';
import { Chain } from '@xchainjs/xchain-util';
import { ethers } from 'ethers';

export class Asset {

  chain: Chain;
  symbol: string;
  ticker: string;
  iconPath: string;

  constructor(poolName: string) {
    const {chain, symbol, ticker } = this.getAssetFromString(poolName);
    this.chain = chain;
    this.symbol = symbol;
    this.ticker = ticker;

    const trustWalletMatch = CoinIconsFromTrustWallet[this.ticker];

    if (trustWalletMatch) {
      this.iconPath = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/${trustWalletMatch}/logo.png`;
    } else {
      // Override token icons when not found in trustwallet


      switch (chain) {
        case 'BTC':
          this.iconPath = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BTCB-1DE/logo.png';
          break;

        case 'BNB':

          if (ticker === 'BNB') {
            this.iconPath = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png';
          }

          break;

        case 'ETH':
          if (this.symbol !== 'ETH') { // for ETH tokens
            this.iconPath = this.setEthIconPath(symbol, ticker);
          }
          break;

        case 'THOR':
          this.iconPath = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/RUNE-B1A/logo.png';
          break;


        default:
          break;
      }

    }

  }

  setEthIconPath(assetSymbol: string, assetTicker: string): string {
    const assetAddress = assetSymbol.slice(assetTicker.length + 1);
    const strip0x = assetAddress.substr(2);
    const checkSummedAddress = ethers.utils.getAddress(strip0x);
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${checkSummedAddress}/logo.png`;
  }

  getAssetFromString(poolName: string): {
    chain: Chain;
    symbol: string;
    ticker: string;
  } {
    let chain: Chain;
    let symbol: string;
    let ticker: string;

    const data = poolName.split('.');
    if (poolName.includes('.')) {
      chain = data[0] as Chain;
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
