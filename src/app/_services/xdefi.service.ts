import { Injectable } from '@angular/core';
// import { TransferResult } from '@thorchain/asgardex-binance';
// import QRCodeModal from '@walletconnect/qrcode-modal';
// import { User } from '../_classes/user';
import { UserService } from './user.service';
// const base64js = require('base64-js');
// const bech32 = require('bech32');
import { environment } from 'src/environments/environment';
// import { decryptFromKeystore } from '@xchainjs/xchain-crypto';
import { Client as binanceClient } from '@xchainjs/xchain-binance';
import { Client as bitcoinClient } from '@xchainjs/xchain-bitcoin';
import { Client as thorchainClient } from '@xchainjs/xchain-thorchain';
import {
  Client as ethereumClient,
  estimateDefaultFeesWithGasPricesAndLimits,
  ETHAddress,
  getTokenAddress,
  TxOverrides,
} from '@xchainjs/xchain-ethereum/lib';
import { Client as litecoinClient } from '@xchainjs/xchain-litecoin';
import { Client as bitcoinCashClient } from '@xchainjs/xchain-bitcoincash';
import { User } from '../_classes/user';
import { rejects } from 'assert';
import { BigNumber } from '@ethersproject/bignumber';
import { ethers } from 'ethers';
import { erc20ABI } from '../_abi/erc20.abi';
import { AssetETH, assetToString } from '@xchainjs/xchain-util';
import { toUtf8Bytes } from '@ethersproject/strings';
import { Address } from '@xchainjs/xchain-client';
import { hexlify } from '@ethersproject/bytes';

@Injectable({
  providedIn: 'root',
})
export class XDEFIService {
  constructor(private userService: UserService) {}

  async initXDEFI() {}

  async connectXDEFI() {
    const network = environment.network === 'testnet' ? 'testnet' : 'mainnet';
    const MOCK_PHRASE =
      'image rally need wedding health address purse army antenna leopard sea gain';
    const phrase = MOCK_PHRASE;
    const userBinanceClient = new binanceClient({ network, phrase });
    const userBtcClient = new bitcoinClient({
      network,
      phrase,
      sochainUrl: 'https://sochain.com/api/v2',
      blockstreamUrl: 'https://blockstream.info',
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

    // @ts-ignore
    userBinanceClient.getAddress = async () => {
      return new Promise((resolve, reject) => {
        (window as any).xfi.binance.request(
          {
            method: 'request_accounts',
            params: [],
          },
          (err, accounts) => {
            if (err) { return reject(err); }
            return resolve(accounts[0]);
          }
        );
      });
    };
    // @ts-ignore
    userBtcClient.getAddress = async () => {
      return new Promise((resolve, reject) => {
        (window as any).xfi.bitcoin.request(
          {
            method: 'request_accounts',
            params: [],
          },
          (err, accounts) => {
            if (err) { return reject(err); }
            return resolve(accounts[0]);
          }
        );
      });
    };
    // @ts-ignore
    userbchClient.getAddress = async () => {
      return new Promise((resolve, reject) => {
        (window as any).xfi.bitcoincash.request(
          {
            method: 'request_accounts',
            params: [],
          },
          (err, accounts) => {
            if (err) { return reject(err); }
            return resolve(accounts[0]);
          }
        );
      });
    };
    // @ts-ignore
    userEthereumClient.getAddress = async () => {
      return (window as any).ethereum.request({
        method: 'eth_requestAccounts',
        params: [],
      });
    };
    // @ts-ignore
    userThorchainClient.getAddress = async () => {
      return new Promise((resolve, reject) => {
        (window as any).xfi.thorchain.request(
          {
            method: 'request_accounts',
            params: [],
          },
          (err, accounts) => {
            if (err) { return reject(err); }
            return resolve(accounts[0]);
          }
        );
      });
    };
    // @ts-ignore
    userLtcClient.getAddress = async () => {
      return new Promise((resolve, reject) => {
        (window as any).xfi.litecoin.request(
          {
            method: 'request_accounts',
            params: [],
          },
          (err, accounts) => {
            if (err) { return reject(err); }
            return resolve(accounts[0]);
          }
        );
      });
    };

    // End shim layer

    const thorAddress = await userThorchainClient.getAddress();
    console.log({ thorAddress });
    const bnbAddress = await userBinanceClient.getAddress();
    console.log({ bnbAddress });
    const btcAddress = await userBtcClient.getAddress();
    console.log({ btcAddress });

    const bchAddress = await userbchClient.getAddress();
    console.log({ bchAddress });

    const ethAddress = (await userEthereumClient.getAddress())[0];
    console.log({ ethAddress });

    const ltcAddress = await userLtcClient.getAddress();
    console.log({ ltcAddress });

    userThorchainClient.getAddress = () => thorAddress;
    userBinanceClient.getAddress = () => bnbAddress;
    userBtcClient.getAddress = () => btcAddress;
    userbchClient.getAddress = () => bchAddress;
    userEthereumClient.getAddress = () => ethAddress;
    userLtcClient.getAddress = () => ltcAddress;

    // Binance
    userBinanceClient.transfer = async (transferParams) => {
      console.log('userBinanceClient.transfer', transferParams);
      return new Promise((resolve, reject) => {
        (window as any).xfi.binance.request(
          {
            method: 'transfer',
            params: [
              {
                ...transferParams,
                from: bnbAddress,
                amount: {
                  amount: transferParams.amount.amount().toString(),
                  decimals: transferParams.amount.decimal,
                },
              },
            ],
          },
          (err, result) => {
            if (err) { return reject(err); }
            return resolve(result);
          }
        );
      });
    };

    // Bitcoin
    userBtcClient.transfer = async (transferParams) => {
      console.log('userBtcClient.transfer', transferParams);
      return new Promise((resolve, reject) => {
        (window as any).xfi.bitcoin.request(
          {
            method: 'transfer',
            params: [
              {
                ...transferParams,
                from: btcAddress,
                amount: {
                  amount: transferParams.amount.amount().toString(),
                  decimals: transferParams.amount.decimal,
                },
              },
            ],
          },
          (err, result) => {
            if (err) { return reject(err); }
            return resolve(result);
          }
        );
      });
    };

    // BCH
    userbchClient.transfer = async (transferParams) => {
      console.log('userbchClient.transfer', transferParams);
      return new Promise((resolve, reject) => {
        (window as any).xfi.bitcoincash.request(
          {
            method: 'transfer',
            params: [
              {
                ...transferParams,
                from: bchAddress,
                amount: {
                  amount: transferParams.amount.amount().toString(),
                  decimals: transferParams.amount.decimal,
                },
              },
            ],
          },
          (err, result) => {
            if (err) { return reject(err); }
            return resolve(result);
          }
        );
      });
    };
    // Eth
    userEthereumClient.approve = async (spender, sender, amount) => {
      console.log('userEthereumClient.approve', spender, sender, amount);
      const txAmount = amount
        ? BigNumber.from(amount.amount().toFixed())
        : BigNumber.from(2).pow(256).sub(1);
      const contract = new ethers.Contract(sender, erc20ABI);
      const unsignedTx = await contract.populateTransaction.approve(
        spender,
        txAmount
      );
      unsignedTx.from = ethAddress;
      return (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [unsignedTx],
      });
    };
    const oldWallet = userEthereumClient.getWallet();
    oldWallet.getAddress = async () => ethAddress;
    oldWallet.sendTransaction = (unsignedTx) => {
      unsignedTx.value = hexlify(BigNumber.from(unsignedTx.value || 0));
      return (window as any).ethereum.request({
        method: 'eth_sendTransaction',
        params: [unsignedTx],
      });
    };
    oldWallet.signTransaction = (unsignedTx) => {
        unsignedTx.value = hexlify(BigNumber.from(unsignedTx.value || 0));

        return (window as any).ethereum.request({
          method: 'eth_signTransaction',
          params: [unsignedTx],
        });
      };
    const newGetWallet = () => {
      return oldWallet;
    };
    userEthereumClient.getWallet = newGetWallet;
    userEthereumClient.transfer = async ({
      asset,
      memo,
      amount,
      recipient,
      feeOptionKey,
      gasPrice,
      gasLimit,
    }) => {
      console.log({
        method: 'ethCLient.transfer',
        asset,
        memo,
        amount,
        recipient,
        feeOptionKey,
        gasPrice,
        gasLimit,
      });
      try {
        const txAmount = BigNumber.from(amount.amount().toFixed());

        let assetAddress;
        if (asset && assetToString(asset) !== assetToString(AssetETH)) {
          assetAddress = getTokenAddress(asset);
        }

        const isETHAddress = assetAddress === ETHAddress;

        // feeOptionKey

        const defaultGasLimit: ethers.BigNumber = isETHAddress
          ? BigNumber.from(21000)
          : BigNumber.from(100000);

        let overrides: TxOverrides = {
          gasLimit: gasLimit || defaultGasLimit,
          gasPrice: gasPrice && BigNumber.from(gasPrice.amount().toFixed()),
        };

        // override `overrides` if `feeOptionKey` is provided
        if (feeOptionKey) {
          const _gasPrice = await userEthereumClient
            .estimateGasPrices()
            .then((prices) => prices[feeOptionKey])
            .catch(
              () =>
                estimateDefaultFeesWithGasPricesAndLimits().gasPrices[
                  feeOptionKey
                ]
            );
          const _gasLimit = await userEthereumClient
            .estimateGasLimit({ asset, recipient, amount, memo })
            .catch(() => defaultGasLimit);

          overrides = {
            gasLimit: _gasLimit,
            gasPrice: BigNumber.from(_gasPrice.amount().toFixed()),
          };
        }

        let txResult;
        if (assetAddress && !isETHAddress) {
          // Transfer ERC20
          const contract = new ethers.Contract(assetAddress, erc20ABI);
          const unsignedTx = await contract.populateTransaction.transfer(
            recipient,
            txAmount,
            Object.assign({}, overrides)
          );
          unsignedTx.from = ethAddress;
          txResult = await (window as any).ethereum.request({
            method: 'eth_sendTransaction',
            params: [unsignedTx],
          });
        } else {
          // Transfer ETH
          const transactionRequest = Object.assign(
            { to: recipient, value: txAmount },
            {
              ...overrides,
              data: memo ? toUtf8Bytes(memo) : undefined,
            }
          );
          txResult = await (window as any).ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionRequest],
          });
        }

        return txResult.hash || txResult;
      } catch (error) {
        console.error(error);
        return Promise.reject(error);
      }

      // return (window as any).ethereum.request({
      //   method: "eth_sendTransaction",
      //   params: [unsignedTx],
      // });
    };
    userEthereumClient.call = async (
      address: Address,
      abi: ethers.ContractInterface,
      func: string,
      params: Array<any>
    ) => {
      console.log({
        method: 'ethCLient.call',
        address,
        abi,
        func,
        params,
      });
      try {
        if (!address) {
          return Promise.reject(new Error('address must be provided'));
        }
        const contract = new ethers.Contract(
          address,
          abi,
          userEthereumClient.getProvider()
        );
        const txResult = await contract[func](...params, {
          from: ethAddress,
        });
        console.log({ txResult });
        return txResult;
      } catch (error) {
        console.error(error);
        console.error('stack');
        return Promise.reject(error);
      }

      // return (window as any).ethereum.request({
      //   method: "eth_sendTransaction",
      //   params: [unsignedTx],
      // });
    };
    // Thor
    userThorchainClient.deposit = async (depositParams) => {
      console.log('userThorchainClient.deposit', depositParams);
      return new Promise((resolve, reject) => {
        (window as any).xfi.thorchain.request(
          {
            method: 'deposit',
            params: [
              {
                ...depositParams,
                from: thorAddress,
                amount: {
                  amount: depositParams.amount.amount().toString(),
                  decimals: depositParams.amount.decimal,
                },
              },
            ],
          },
          (err, result) => {
            if (err) {
              return reject(err);
            }
            return resolve(result);
          }
        );
      });
    };
    // Ltc
    userLtcClient.transfer = async (transferParams) => {
      console.log('userLtcClient.transfer', transferParams);
      return new Promise((resolve, reject) => {
        (window as any).xfi.litecoin.request(
          {
            method: 'transfer',
            params: [
              {
                ...transferParams,
                from: ltcAddress,
                amount: {
                  amount: transferParams.amount.amount().toString(),
                  decimals: transferParams.amount.decimal,
                },
              },
            ],
          },
          (err, result) => {
            if (err) { return reject(err); }
            return resolve(result);
          }
        );
      });
    };

    console.log({
      thorAddress,
      bnbAddress,
      btcAddress,
      bchAddress,
      ethAddress,
      ltcAddress,
    });

    const newUser = new User({
      type: 'XDEFI',
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
