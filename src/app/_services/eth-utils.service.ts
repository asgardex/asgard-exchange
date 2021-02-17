import { Injectable } from '@angular/core';
import { Asset } from '../_classes/asset';
import { ethers } from 'ethers';
import { PoolAddressDTO } from '../_classes/pool-address';
import { TCRopstenAbi } from '../_abi/thorchain.abi.js';
import { Client, ETH_DECIMAL } from '@xchainjs/xchain-ethereum/lib';
import { assetAmount, assetToBase } from '@xchainjs/xchain-util';
import BigNumber from 'bignumber.js';
import { erc20ABI } from '../_abi/erc20.abi';
import { environment } from '../../environments/environment';

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

@Injectable({
  providedIn: 'root'
})
export class EthUtilsService {

  constructor() { }

  async estimateFee({sourceAsset, ethClient, ethInbound, inputAmount, memo}: EstimateFeeParams): Promise<BigNumber> {

    let checkSummedAddress;
    let decimal;
    const wallet = ethClient.getWallet();

    if (sourceAsset.symbol === 'ETH') {
      checkSummedAddress = '0x0000000000000000000000000000000000000000';
      decimal = ETH_DECIMAL;
    } else {
      const assetAddress = sourceAsset.symbol.slice(sourceAsset.ticker.length + 1);
      const strip0x = assetAddress.substr(2);
      checkSummedAddress = ethers.utils.getAddress(strip0x);

      const tokenContract = new ethers.Contract(checkSummedAddress, erc20ABI, wallet);
      const tokenDecimals = await tokenContract.decimals();
      decimal = tokenDecimals.toNumber();
    }
    const contract = new ethers.Contract(ethInbound.router, TCRopstenAbi, wallet);

    const params = [
      // Vault Address
      ethInbound.address,

      // Token Address
      checkSummedAddress,

      // Amount
      assetToBase(assetAmount(inputAmount, decimal)).amount().toString(),

      // Memo
      memo
    ];

    const estimateGas = await contract.estimateGas.deposit(...params);
    const prices = await ethClient.estimateGasPrices();
    const minimumWeiCost = prices.average.amount().multipliedBy(estimateGas.toNumber());

    return minimumWeiCost;
  }

  async callDeposit({inboundAddress, asset, memo, ethClient, amount}: CallDepositParams): Promise<string> {

    let hash;
    const wallet = ethClient.getWallet();
    const abi = (environment.network) === 'testnet'
      ? TCRopstenAbi
      : TCRopstenAbi;

    if (asset.ticker === 'ETH') {

      const ethAddress = await ethClient.getAddress();
      const contract = new ethers.Contract(inboundAddress.router, abi, wallet);
      const contractRes = await contract.deposit(
        inboundAddress.address, // not sure if this is correct...
        '0x0000000000000000000000000000000000000000',
        ethers.utils.parseEther(String(amount)),
        // memo,
        memo,
        {from: ethAddress, value: ethers.utils.parseEther(String(amount))}
      );

      hash = contractRes['hash'] ? contractRes['hash'] : '';

    } else {

      const assetAddress = asset.symbol.slice(asset.ticker.length + 1);
      const strip0x = assetAddress.substr(2);
      const checkSummedAddress = ethers.utils.getAddress(strip0x);
      const tokenContract = new ethers.Contract(checkSummedAddress, erc20ABI, wallet);
      const decimal = await tokenContract.decimals();
      const params = [
        inboundAddress.address, // vault
        checkSummedAddress, // asset
        assetToBase(assetAmount(amount, decimal.toNumber())).amount().toString(), // amount
        memo
      ];

      const contractRes = await ethClient.call(inboundAddress.router, abi, 'deposit', params);

      hash = contractRes['hash'] ? contractRes['hash'] : '';

    }

    return hash;

  }

}
