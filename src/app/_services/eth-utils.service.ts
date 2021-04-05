import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { PoolAddressDTO } from '../_classes/pool-address';
import { TCRopstenAbi } from '../_abi/thorchain.abi';
import { Client, ETH_DECIMAL } from '@xchainjs/xchain-ethereum/lib';
import { assetAmount, assetToBase, baseAmount } from '@xchainjs/xchain-util';
import BigNumber from 'bignumber.js';
import { erc20ABI } from '../_abi/erc20.abi';
import { environment } from '../../environments/environment';
import { ethRUNERopsten } from '../_abi/erc20RUNE.abi';
import { MidgardService } from './midgard.service';
import { Client as EthClient } from '@xchainjs/xchain-ethereum';
import { Asset } from '@xchainjs/xchain-util';

export type EstimateFeeParams = {
  sourceAsset: Asset,
  ethClient: Client,
  ethInbound: PoolAddressDTO,
  inputAmount: number,
  memo: string
};

export type CallDepositParams = {
  inboundAddress: PoolAddressDTO,
  asset: Asset,
  memo: string,
  ethClient: Client,
  amount: number
};

export type EstimateApprovalFee = {ethClient: EthClient, contractAddress: string, asset: Asset};

// tslint:disable-next-line:quotemark object-literal-key-quotes whitespace
const testnetBasketABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"coin","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"addCoin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"coins","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"giveMeCoins","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"isAdded","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}];

@Injectable({
  providedIn: 'root'
})
export class EthUtilsService {

  constructor(private midgardService: MidgardService) { }

  async estimateFee({sourceAsset, ethClient, ethInbound, inputAmount, memo}: EstimateFeeParams): Promise<BigNumber> {

    let checkSummedAddress;
    const wallet = ethClient.getWallet();
    const decimal = await this.getAssetDecimal(sourceAsset, ethClient);

    if (sourceAsset.symbol === 'ETH') {
      checkSummedAddress = '0x0000000000000000000000000000000000000000';
    } else {
      const assetAddress = sourceAsset.symbol.slice(sourceAsset.ticker.length + 1);
      const strip0x = assetAddress.substr(2);
      checkSummedAddress = ethers.utils.getAddress(strip0x);
    }

    const contract = new ethers.Contract(ethInbound.router, TCRopstenAbi, wallet);

    const params = [
      // Vault Address
      ethInbound.address,

      // Token Address
      checkSummedAddress,

      // Amount
      assetToBase(assetAmount(inputAmount, decimal)).amount().toFixed(),

      // Memo
      memo
    ];

    const estimateGas = await contract.estimateGas.deposit(...params);
    const prices = await ethClient.estimateGasPrices();
    const minimumWeiCost = prices.fast.amount().multipliedBy(estimateGas.toNumber());

    return minimumWeiCost;
  }

  async getAssetDecimal(asset: Asset, client: Client): Promise<number> {

    if (asset.chain === 'ETH') {
      if (asset.symbol === 'ETH') {
        return ETH_DECIMAL;
      } else {
        const wallet = client.getWallet();
        const assetAddress = asset.symbol.slice(asset.ticker.length + 1);
        const strip0x = assetAddress.substr(2);
        const checkSummedAddress = ethers.utils.getAddress(strip0x);
        const tokenContract = new ethers.Contract(checkSummedAddress, erc20ABI, wallet);
        const tokenDecimals = await tokenContract.decimals();
        return tokenDecimals.toNumber();
      }
    } else {
      throw new Error('asset chain not ETH');
    }

  }

  async estimateApproveFee({ethClient, contractAddress, asset}: EstimateApprovalFee) {
    const wallet = ethClient.getWallet();
    const assetAddress = asset.symbol.slice(asset.ticker.length + 1);
    const strip0x = (assetAddress.toUpperCase().indexOf('0X') === 0) ? assetAddress.substr(2) : assetAddress;
    const checkSummedAddress = ethers.utils.getAddress(strip0x);
    const contract = new ethers.Contract(checkSummedAddress, erc20ABI, wallet);
    const estimateGas = await contract.estimateGas.approve(contractAddress, checkSummedAddress);
    const prices = await ethClient.estimateGasPrices();
    const minimumWeiCost = prices.average.amount().multipliedBy(estimateGas.toNumber());
    return minimumWeiCost;
  }

  async maximumSpendableBalance(ethParams: {asset: Asset, balance: number, client: EthClient}) {

    const {asset, balance, client } = ethParams;

    if (asset.chain === 'ETH' && asset.symbol === 'ETH') {
        const estimate = await client.estimateFeesWithGasPricesAndLimits({
          asset,
          amount: assetToBase(assetAmount(balance)),
          recipient: '0x8b09ee8b5e96c6412e36ba02e98497efe48a29be' // dummy value only used to estimate ETH transfer
        });
        const toEther = ethers.utils.formatEther(estimate.fees.fastest.amount().toNumber());
        const max = balance - (+toEther);
        return (max >= 0) ? max : 0;
    } else {
      return balance;
    }

  }

  async callDeposit({inboundAddress, asset, memo, ethClient, amount}: CallDepositParams): Promise<string> {
    console.log({
      method: 'callDeposit',
      inboundAddress, asset, memo, ethClient, amount
    });
    let hash;
    const abi = (environment.network) === 'testnet'
      ? TCRopstenAbi
      : TCRopstenAbi;
    const ethAddress = await ethClient.getAddress();

    if (asset.ticker === 'ETH') {

      const contract = new ethers.Contract(inboundAddress.router, abi);
      const unsignedTx = await contract.populateTransaction.deposit(
        inboundAddress.address, // not sure if this is correct...
        '0x0000000000000000000000000000000000000000',
        ethers.utils.parseEther(String(amount)),
        // memo,
        memo,
        {from: ethAddress, value: ethers.utils.parseEther(String(amount))}
      );
      console.log({unsignedTx});
      const contractRes = await ethClient
        .getWallet()
        .sendTransaction(unsignedTx);
      console.log({contractRes});

      // tslint:disable-next-line:no-string-literal
      hash = contractRes['hash'] ? contractRes['hash'] : '';

    } else {

      const assetAddress = asset.symbol.slice(asset.ticker.length + 1);
      const strip0x = assetAddress.substr(2);
      const checkSummedAddress = ethers.utils.getAddress(strip0x);
      // const tokenContract = new ethers.Contract(checkSummedAddress, erc20ABI);
      const decimal: BigNumber = await ethClient.call(checkSummedAddress, erc20ABI, 'decimals', []);
      // const decimal = await tokenContract.decimals();
      const params = [
        inboundAddress.address, // vault
        checkSummedAddress, // asset
        assetToBase(assetAmount(amount, decimal.toNumber())).amount().toFixed(), // amount
        memo
      ];
      const vaultContract = new ethers.Contract(inboundAddress.router, abi);
      const unsignedTx = await vaultContract.populateTransaction.deposit(
        ...params,
        {from: ethAddress}
      );
      console.log({unsignedTx});
      const contractRes = await ethClient
        .getWallet()
        .sendTransaction(unsignedTx);
      console.log({contractRes});
      // const contractRes = await ethClient(inboundAddress.router, abi, 'deposit', params);

      // tslint:disable-next-line:no-string-literal
      hash = contractRes['hash'] ? contractRes['hash'] : '';

    }

    return hash;

  }

  async checkContractApproved(ethClient: Client, asset: Asset): Promise<boolean> {
    const addresses = await this.midgardService.getInboundAddresses().toPromise();
    const ethInbound = addresses.find( (inbound) => inbound.chain === 'ETH' );
    if (!ethInbound) {
      console.error('no eth inbound address found');
      return;
    }
    const assetAddress = asset.symbol.slice(asset.ticker.length + 1);
    const strip0x = (assetAddress.toUpperCase().indexOf('0X') === 0) ? assetAddress.substr(2) : assetAddress;
    const isApproved = await ethClient.isApproved(ethInbound.router, strip0x, baseAmount(1));
    return isApproved;
  }

  async getTestnetRune(ethClient: Client) {

    try {
      const wallet = await ethClient.getWallet();

      const basketERC20Contract = new ethers.Contract('0xEF7a88873190098F0EA2CFB7C68AF9526AD79aad', testnetBasketABI, wallet);
      await basketERC20Contract.giveMeCoins();

      const testnetRuneContract = new ethers.Contract('0xd601c6A3a36721320573885A8d8420746dA3d7A0', ethRUNERopsten, wallet);
      await testnetRuneContract.functions.giveMeRUNE();

    } catch (error) {
      console.log('error getting testnet RUNE');
      console.log(error);
    }

  }

}
