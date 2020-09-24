import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Client as binanceClient,
  BinanceClient,
  TransferResult
} from '@thorchain/asgardex-binance';
import WalletConnect from '@trustwallet/walletconnect';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { environment } from 'src/environments/environment';
import { User } from '../_classes/user';
import { UserService } from './user.service';
import base64js from 'base64-js';
const bech32 = require('bech32');

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  asgardexBncClient: BinanceClient;
  walletConnector: WalletConnect;

  get bncClient() {
    return this.asgardexBncClient.getBncClient();
  }

  constructor(private userService: UserService, private http: HttpClient) {
    this.asgardexBncClient = new binanceClient({
      network: environment.network === 'testnet' ? 'testnet' : 'mainnet',
    });

  }

  async initWalletConnect() {

    this.walletConnector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org', // Required
      // qrcodeModal: QRCodeModal,
    });

    await this.walletConnector.killSession();

    console.log('connected is: ', this.walletConnector.connected);

    if (this.walletConnector.connected && this.walletConnector.accounts && this.walletConnector.accounts.length > 0) {

      this.connectWalletConnect();

    }

  }

  async connectWalletConnect() {

    // this.walletConnector.killSession();

    // Check if connection is already established
    if (!this.walletConnector.connected) {
      // create new session
      await this.walletConnector.createSession();
      const uri = this.walletConnector.uri;
      // display QR Code modal
      QRCodeModal.open(uri, () => {});
    }

    // Subscribe to connection events
    this.walletConnector.on('connect', async (error, payload) => {
      if (error) {
        throw error;
      }

      // this.walletConnector.networkId = 714;

      // Close QR Code Modal
      QRCodeModal.close();

      const accounts = await this.walletConnector.getAccounts();
      const bnbAccount = accounts.find( (account) => account.network === 714 );
      console.log('accoutns are: ', accounts);

      const user = new User({type: 'walletconnect', wallet: bnbAccount.address});

      this.userService.setUser(user);

      // Get provided accounts and chainId
      // const { accounts, chainId } = payload.params[0];
    });

    this.walletConnector.on('session_update', (error, payload) => {
      if (error) {
        throw error;
      }

      // Get updated accounts and chainId
      // const { accounts, chainId } = payload.params[0];
    });

    this.walletConnector.on('disconnect', (error, payload) => {
      if (error) {
        throw error;
      }

      this.userService.setUser(null);

      this.walletConnector = null;

      // Delete connector
    });

  }

  walletConnectSendTx(tx): Promise<TransferResult> {

    const NETWORK_ID = 714;

    return new Promise( (resolve, reject) => {
      this.walletConnector
      .trustSignTransaction(NETWORK_ID, tx)
      .then((result) => {
        console.log('Successfully signed stake tx msg:', result);
        this.bncClient
          .sendRawTransaction(result, true)
          .then((response) => {
            console.log('Response', response);
            resolve(response);
          })
          .catch((error) => {
            console.log('sendRawTransaction error: ', error);
            reject(error);
          });
      })
      .catch((error) => {
        console.log('trustSignTransaction error: ', error);

        reject(error);
      });
    });

  }

  _getByteArrayFromAddress(address: string) {
    const decodeAddress = bech32.decode(address);
    return base64js.fromByteArray(Buffer.from(bech32.fromWords(decodeAddress.words)));
  }

  walletConnectGetSendOrderMsg({
    fromAddress,
    toAddress,
    coins: coinData,
  }) {
    // 1. sort denoms by alphabet order
    // 2. validate coins with zero amounts
    const coins = coinData
      .sort((a, b) => a.denom.localeCompare(b.denom))
      .filter(data => {
        return data.amount > 0;
      });


    console.log('coins are: ', coins);

    // if coin data is invalid, return null
    if (!coins.length) {
      return null;
    }

    const msg = {
      inputs: [
        {
          address: this._getByteArrayFromAddress(fromAddress),
          coins,
        },
      ],
      outputs: [
        {
          address: this._getByteArrayFromAddress(toAddress),
          coins,
        },
      ],
    };

    return msg;
  }

}
