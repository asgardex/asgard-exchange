import { Injectable } from "@angular/core";
// import { TransferResult } from '@thorchain/asgardex-binance';
// import QRCodeModal from '@walletconnect/qrcode-modal';
// import { User } from '../_classes/user';
import { UserService } from "./user.service";
// const base64js = require('base64-js');
// const bech32 = require('bech32');
import { environment } from "src/environments/environment";
// import { decryptFromKeystore } from '@xchainjs/xchain-crypto';
import { Client as binanceClient } from "@xchainjs/xchain-binance";
import { Client as bitcoinClient } from "@xchainjs/xchain-bitcoin";
import { Client as thorchainClient } from "@xchainjs/xchain-thorchain";
import { Client as ethereumClient } from "@xchainjs/xchain-ethereum/lib";
import { Client as litecoinClient } from "@xchainjs/xchain-litecoin";
import { Client as bitcoinCashClient } from "@xchainjs/xchain-bitcoincash";
import { User } from "../_classes/user";
import { rejects } from "assert";

@Injectable({
  providedIn: "root",
})
export class XDEFIService {
  constructor(private userService: UserService) {}

  async initXDEFI() {}

  async connectXDEFI() {
    const network = environment.network === "testnet" ? "testnet" : "mainnet";
    const MOCK_PHRASE =
      "image rally need wedding health address purse army antenna leopard sea gain";
    const phrase = MOCK_PHRASE;
    const userBinanceClient = new binanceClient({ network, phrase });
    const userBtcClient = new bitcoinClient({
      network,
      phrase,
      sochainUrl: "https://sochain.com/api/v2",
      blockstreamUrl: "https://blockstream.info",
    });
    const userThorchainClient = new thorchainClient({ network, phrase });
    const userEthereumClient = new ethereumClient({
      network,
      phrase,
      etherscanApiKey: environment.etherscanKey,
      infuraCreds: { projectId: environment.infuraProjectId },
    });
    const userLtcClient = new litecoinClient({ network, phrase });
    const userbchClient = new bitcoinCashClient({ network, phrase });

    // XDEFI shim layer
    // Binance
    userBinanceClient.transfer = async function (transferParams) {
      return new Promise((resolve, reject) => {
        (window as any).xfi.binance.request(
          {
            method: "transfer",
            params: [transferParams],
          },
          (err, result) => {
            if (err) return reject(err);
            return resolve(result);
          }
        );
      });
    };

    // @ts-ignore
    userBinanceClient.getAddress = async function () {
      return new Promise((resolve, reject) => {
        (window as any).xfi.binance.request(
          {
            method: "request_accounts",
            params: [],
          },
          (err, accounts) => {
            if (err) return reject(err);
            return resolve(accounts[0]);
          }
        );
      });
    };

    // Bitcoin
    userBtcClient.transfer = async function (transferParams) {
      return new Promise((resolve, reject) => {
        (window as any).xfi.bitcoin.request(
          {
            method: "transfer",
            params: [transferParams],
          },
          (err, result) => {
            if (err) return reject(err);
            return resolve(result);
          }
        );
      });
    };
    // @ts-ignore
    userBtcClient.getAddress = async function () {
      return new Promise((resolve, reject) => {
        (window as any).xfi.bitcoin.request(
          {
            method: "request_accounts",
            params: [],
          },
          (err, accounts) => {
            if (err) return reject(err);
            return resolve(accounts[0]);
          }
        );
      });
    };

    // BCH
    userbchClient.transfer = async function (transferParams) {
      return new Promise((resolve, reject) => {
        (window as any).xfi.bitcoincash.request(
          {
            method: "transfer",
            params: [transferParams],
          },
          (err, result) => {
            if (err) return reject(err);
            return resolve(result);
          }
        );
      });
    };
    // @ts-ignore
    userbchClient.getAddress = async function () {
      return new Promise((resolve, reject) => {
        (window as any).xfi.bitcoincash.request(
          {
            method: "request_accounts",
            params: [],
          },
          (err, accounts) => {
            if (err) return reject(err);
            return resolve(accounts[0]);
          }
        );
      });
    };

    // Eth
    userEthereumClient.approve = function (params) {
      return Promise.resolve({} as any); // TODO: ethereum approve logic
    };
    // @ts-ignore
    userEthereumClient.getAddress = async function () {
      return new Promise((resolve, reject) => {
        (window as any).ethereum.request(
          {
            method: "eth_requestAccounts",
            params: [],
          },
          (err, accounts) => {
            if (err) return reject(err);
            return resolve(accounts[0]);
          }
        );
      });
    };

    // Thor
    userThorchainClient.deposit = async function (depositParams) {
      return new Promise((resolve, reject) => {
        (window as any).xfi.thorchain.request(
          {
            method: "deposit",
            params: [depositParams],
          },
          (err, result) => {
            if (err) return reject(err);
            return resolve(result);
          }
        );
      });
    };
    // @ts-ignore
    userThorchainClient.getAddress = async function () {
      return new Promise((resolve, reject) => {
        (window as any).xfi.thorchain.request(
          {
            method: "request_accounts",
            params: [],
          },
          (err, accounts) => {
            if (err) return reject(err);
            return resolve(accounts[0]);
          }
        );
      });
    };

    // Ltc
    userLtcClient.transfer = async function (transferParams) {
      return new Promise((resolve, reject) => {
        (window as any).xfi.litecoin.request(
          {
            method: "transfer",
            params: [transferParams],
          },
          (err, result) => {
            if (err) return reject(err);
            return resolve(result);
          }
        );
      });
    };
    // @ts-ignore
    userLtcClient.getAddress = async function () {
      return new Promise((resolve, reject) => {
        (window as any).xfi.litecoin.request(
          {
            method: "request_accounts",
            params: [],
          },
          (err, accounts) => {
            if (err) return reject(err);
            return resolve(accounts[0]);
          }
        );
      });
    };

    // End shim layer

    const thorAddress = await userThorchainClient.getAddress();

    const newUser = new User({
      type: "XDEFI",
      wallet: thorAddress,
      clients: {
        binance: userBinanceClient,
        bitcoin: userBtcClient,
        bitcoinCash: userbchClient,
        thorchain: userThorchainClient,
        ethereum: userEthereumClient,
        litecoin: userLtcClient,
      },
    });

    return newUser;
    // // await this.walletConnector.killSession();
    // if (!this.walletConnector) {
    //   this.initXDEFI();
    // }
    // // Check if connection is already established
    // if (!this.walletConnector.connected) {
    //   // create new session
    //   await this.walletConnector.createSession();
    //   const uri = this.walletConnector.uri;
    //   // display QR Code modal
    //   QRCodeModal.open(uri, () => {});
    // }
    // // Subscribe to connection events
    // this.walletConnector.on("connect", async (error, payload) => {
    //   if (error) {
    //     throw error;
    //   }
    //   // Close QR Code Modal
    //   QRCodeModal.close();
    //   const accounts = await this.walletConnector.getAccounts();
    //   const bnbAccount = accounts.find((account) => account.network === 714);
    //   if (bnbAccount) {
    //     const user = new User({
    //       type: "walletconnect",
    //       wallet: bnbAccount.address,
    //     });
    //     this.userService.setUser(user);
    //   }
    // });
    // this.walletConnector.on("session_update", (error, payload) => {
    //   if (error) {
    //     throw error;
    //   }
    // });
    // this.walletConnector.on("disconnect", (error, payload) => {
    //   if (error) {
    //     throw error;
    //   }
    //   this.userService.setUser(null); // Reset user as null
    //   this.walletConnector = null; // Delete connector
    // });
  }

  // // TODO: add BncClient to asgardex/binance types
  // // TODO: set tx type
  // walletConnectSendTx(tx, bncClient): Promise<TransferResult> {
  //   const NETWORK_ID = 714;

  //   return new Promise((resolve, reject) => {
  //     this.walletConnector
  //       .trustSignTransaction(NETWORK_ID, tx)
  //       .then((result) => {
  //         bncClient
  //           .sendRawTransaction(result, true)
  //           .then((response) => {
  //             resolve(response);
  //           })
  //           .catch((error) => {
  //             reject(error);
  //           });
  //       })
  //       .catch((error) => {
  //         console.error("trustSignTransaction error: ", error);
  //         reject(error);
  //       });
  //   });
  // }

  // _getByteArrayFromAddress(address: string) {
  //   const decodeAddress = bech32.decode(address);
  //   return base64js.fromByteArray(
  //     Buffer.from(bech32.fromWords(decodeAddress.words))
  //   );
  // }

  // walletConnectGetSendOrderMsg({ fromAddress, toAddress, coins: coinData }) {
  //   // 1. sort denoms by alphabet order
  //   // 2. validate coins with zero amounts
  //   const coins = coinData
  //     .sort((a, b) => a.denom.localeCompare(b.denom))
  //     .filter((data) => {
  //       return data.amount > 0;
  //     });

  //   // if coin data is invalid, return null
  //   if (!coins.length) {
  //     return null;
  //   }

  //   const msg = {
  //     inputs: [
  //       {
  //         address: this._getByteArrayFromAddress(fromAddress),
  //         coins,
  //       },
  //     ],
  //     outputs: [
  //       {
  //         address: this._getByteArrayFromAddress(toAddress),
  //         coins,
  //       },
  //     ],
  //   };

  //   return msg;
  // }
}
