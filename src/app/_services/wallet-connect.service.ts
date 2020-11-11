import { Injectable } from '@angular/core';
import WalletConnect from '@trustwallet/walletconnect';
import { TransferResult } from '@thorchain/asgardex-binance';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { User } from '../_classes/user';
import { UserService } from './user.service';
import base64js from 'base64-js';
const bech32 = require('bech32');

@Injectable({
  providedIn: 'root'
})
export class WalletConnectService {

  walletConnector: WalletConnect;

  constructor(private userService: UserService) { }

  async initWalletConnect() {

    this.walletConnector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org', // Required
      // qrcodeModal: QRCodeModal,
    });

    await this.walletConnector.killSession();

  }

  async connectWalletConnect() {

    // await this.walletConnector.killSession();

    if (!this.walletConnector) {
      this.initWalletConnect();
    }

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

      // Close QR Code Modal
      QRCodeModal.close();

      const accounts = await this.walletConnector.getAccounts();
      const bnbAccount = accounts.find( (account) => account.network === 714 );

      if (bnbAccount) {
        const user = new User({type: 'walletconnect', wallet: bnbAccount.address, clients: {}});
        this.userService.setUser(user);
      }

    });

    this.walletConnector.on('session_update', (error, payload) => {
      if (error) {
        throw error;
      }

    });

    this.walletConnector.on('disconnect', (error, payload) => {

      if (error) {
        throw error;
      }

      this.userService.setUser(null); // Reset user as null
      this.walletConnector = null; // Delete connector
    });

  }

  // TODO: add BncClient to asgardex/binance types
  // TODO: set tx type
  walletConnectSendTx(tx, bncClient): Promise<TransferResult> {

    const NETWORK_ID = 714;

    return new Promise( (resolve, reject) => {
      this.walletConnector
      .trustSignTransaction(NETWORK_ID, tx)
      .then((result) => {

        bncClient
          .sendRawTransaction(result, true)
          .then((response) => {
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      })
      .catch((error) => {
        console.error('trustSignTransaction error: ', error);
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
