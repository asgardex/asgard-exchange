import { Injectable } from '@angular/core';
import {
  Client as binanceClient,
  BinanceClient,
  Balance,
} from '@thorchain/asgardex-binance';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { User } from '../_classes/user';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  asgardexBncClient: BinanceClient;
  walletConnector: WalletConnect;

  get bncClient() {
    return this.asgardexBncClient.getBncClient();
  }

  constructor(private userService: UserService) {
    this.asgardexBncClient = new binanceClient({
      network: 'testnet',
    });

  }

  initWalletConnect() {

    console.log('init wallet connect');

    this.walletConnector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org', // Required
      // qrcodeModal: QRCodeModal,
    });

    // this.walletConnector.killSession();

    console.log('connected is: ', this.walletConnector.connected);

    if (this.walletConnector.connected && this.walletConnector.accounts && this.walletConnector.accounts.length > 0) {

      console.log(this.walletConnector);

      console.log('this.walletConnector.connected?', this.walletConnector.connected);

      console.log('wallet connector accounts are: ', this.walletConnector.accounts);

      const user = new User({type: 'keystore', wallet: this.walletConnector.accounts[0]});

      this.userService.setUser(user);

    }

  }

  async connectWalletConnect() {

    console.log('connect wallet connect!');

    // // Create a connector
    // this.walletConnecter = new WalletConnect({
    //   bridge: 'https://bridge.walletconnect.org', // Required
    //   qrcodeModal: QRCodeModal,
    // });

    // this.walletConnector.killSession();

    // Check if connection is already established
    if (!this.walletConnector.connected) {
      // create new session
      await this.walletConnector.createSession({
        // chainId: 714
      });
      const uri = this.walletConnector.uri;
      // display QR Code modal
      QRCodeModal.open(uri, () => {});
    }

    // Subscribe to connection events
    this.walletConnector.on('connect', (error, payload) => {
      if (error) {
        throw error;
      }

      // this.walletConnector.networkId = 714;

      // Close QR Code Modal
      QRCodeModal.close();

      const user = new User({type: 'keystore', wallet: this.walletConnector.accounts[0]});

      this.userService.setUser(null);

      console.log('CONNETED!');
      console.log('payload is: ');
      console.log(payload);

      // Get provided accounts and chainId
      const { accounts, chainId } = payload.params[0];
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

}
