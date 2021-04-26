import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { PoolAddressDTO } from '../_classes/pool-address';
import { TCAbi, TCRopstenAbi } from '../_abi/thorchain.abi';
import { Client, ETH_DECIMAL } from '@xchainjs/xchain-ethereum/lib';
import { assetAmount, assetToBase, baseAmount, bn } from '@xchainjs/xchain-util';
import BigNumber from 'bignumber.js';
import { erc20ABI } from '../_abi/erc20.abi';
import { environment } from '../../environments/environment';
import { ethRUNERopsten } from '../_abi/erc20RUNE.abi';
import { MidgardService } from './midgard.service';
import { Client as EthClient } from '@xchainjs/xchain-ethereum';
import { Asset } from '@xchainjs/xchain-util';
import { PoolDTO } from '../_classes/pool';

export type EstimateFeeParams = {
  sourceAsset: Asset,
  ethClient: Client,
  ethInbound: PoolAddressDTO,
  // inputAmount: number,
  inputAmount: BigNumber;
  memo: string
};

export type CallDepositParams = {
  inboundAddress: PoolAddressDTO,
  asset: Asset,
  memo: string,
  ethClient: Client,
  // amount: number
  amount: BigNumber
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
    // const decimal = await this.getAssetDecimal(sourceAsset, ethClient);
    const abi = (environment.network === 'testnet')
      ? TCRopstenAbi
      : TCAbi;

    // testing
    const gasPrices = await ethClient.estimateGasPrices();
    const gasPrice = gasPrices.fast.amount().toFixed(0);
    console.log('gas price is: ', gasPrice);
    console.log('inboundAddress.gas_rate: ', ethInbound.gas_rate);
    console.log('inbound address formatted is: ',
      baseAmount(ethers.utils.parseUnits(ethInbound.gas_rate, 'gwei').toString(), ETH_DECIMAL
    ).amount().toFixed(0));
    // end testing

    if (sourceAsset.symbol === 'ETH') {
      checkSummedAddress = '0x0000000000000000000000000000000000000000';
    } else {
      const assetAddress = sourceAsset.symbol.slice(sourceAsset.ticker.length + 1);
      const strip0x = (assetAddress.substr(0, 2).toUpperCase() === '0X')
        ? assetAddress.substr(2)
        : assetAddress;
      checkSummedAddress = ethers.utils.getAddress(strip0x);
    }

    const contract = new ethers.Contract(ethInbound.router, abi, wallet);

    const params = [
      // Vault Address
      ethInbound.address,

      // Token Address
      checkSummedAddress,

      // Amount
      // assetToBase(assetAmount(inputAmount, decimal)).amount().toFixed(),
      inputAmount.toFixed(),

      // Memo
      memo
    ];

    const estimateGas = await contract.estimateGas.deposit(...params);
    const minimumCost = baseAmount(
      ethers.utils.parseUnits(ethInbound.gas_rate, 'gwei').toString(),
      ETH_DECIMAL
    ).amount().multipliedBy(estimateGas.toNumber());

    return minimumCost;
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

  async maximumSpendableBalance(ethParams: {asset: Asset, balance: number, client: EthClient}) {

    const {asset, balance, client } = ethParams;

    if (balance <= 0) {
      return balance;
    }

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
    let hash;
    const abi = (environment.network) === 'testnet'
      ? TCRopstenAbi
      : TCRopstenAbi;
    const ethAddress = await ethClient.getAddress();
    const gasPrice = baseAmount(ethers.utils.parseUnits(inboundAddress.gas_rate, 'gwei').toString(), ETH_DECIMAL).amount().toFixed(0);

    if (asset.ticker === 'ETH') {

      const contract = new ethers.Contract(inboundAddress.router, abi);
      const unsignedTx = await contract.populateTransaction.deposit(
        inboundAddress.address,
        '0x0000000000000000000000000000000000000000',
        amount.toFixed(),
        memo,
        {from: ethAddress, value: amount.toFixed(), gasPrice}
      );
      const resp = await ethClient
        .getWallet()
        .sendTransaction(unsignedTx);

      hash = typeof(resp) === 'string' ? resp : resp?.hash || '';

    } else {

      const assetAddress = asset.symbol.slice(asset.ticker.length + 1);
      const strip0x = assetAddress.substr(2);
      const checkSummedAddress = ethers.utils.getAddress(strip0x);
      const params = [
        inboundAddress.address, // vault
        checkSummedAddress, // asset
        amount.toFixed(), // amount
        memo,
      ];
      const vaultContract = new ethers.Contract(inboundAddress.router, abi);
      const unsignedTx = await vaultContract.populateTransaction.deposit(
        ...params,
        {from: ethAddress, gasPrice}
      );
      const resp = await ethClient
        .getWallet()
        .sendTransaction(unsignedTx);

      hash = typeof(resp) === 'string' ? resp : resp?.hash || '';

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

  async estimateERC20Time(token: string, tokenAmount: number): Promise<number> {
    const tokenPool = await this.midgardService.getPool(token).toPromise();
    const ethPool = await this.midgardService.getPool('ETH.ETH').toPromise();
    const assetUnitsPerEth = (+tokenPool.assetPriceUSD) / (+ethPool.assetPriceUSD);
    const totalInEth = (tokenAmount * assetUnitsPerEth);
    const chainBlockReward = 3;
    const chainBlockTime = 15; // seconds
    const estimatedMinutes = (Math.ceil( totalInEth / chainBlockReward) * (chainBlockTime / 60));
    return (estimatedMinutes < 1) ? 1 : estimatedMinutes;
  }

  getErc20ValueInEth(ethPool: PoolDTO, tokenPool: PoolDTO) {
    return (+tokenPool.assetPriceUSD) / (+ethPool.assetPriceUSD);
  }

}
