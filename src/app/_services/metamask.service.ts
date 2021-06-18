import { Injectable } from '@angular/core';
import { assetAmount, assetToBase, baseAmount } from '@xchainjs/xchain-util';
import { ethers } from 'ethers';
import { ReplaySubject } from 'rxjs';
import { erc20ABI } from '../_abi/erc20.abi';
import { Asset } from '../_classes/asset';
import { PoolAddressDTO } from '../_classes/pool-address';
// import { erc20ABI } from '../_abi/erc20.abi';
import { UserService } from './user.service';
import { ETH_DECIMAL, getTokenAddress } from '@xchainjs/xchain-ethereum';
import { TCAbi } from '../_abi/thorchain.abi';

declare global {
  interface Window {
    ethereum: any;
  }
}

export interface MetaMaskDepositParams {
  ethInboundAddress: PoolAddressDTO;
  input: number;
  asset: Asset;
  memo: string;
  userAddress: string;
  signer: ethers.providers.JsonRpcSigner;
}

window.ethereum = window.ethereum || {};

@Injectable({
  providedIn: 'root',
})
export class MetamaskService {
  private _provider = new ReplaySubject<ethers.providers.Web3Provider>();
  provider$ = this._provider.asObservable();

  constructor(private userService: UserService) {
    if (window.ethereum && window.ethereum.on) {
      window.ethereum.on('accountsChanged', (a) =>
        this.handleAccountsChanged(a, this._provider)
      );
      this.init();
      console.log('this provider is: ', this._provider);
    }
  }

  handleAccountsChanged(
    accounts: any,
    provider: ReplaySubject<ethers.providers.Web3Provider>
  ) {
    const ethProvider = new ethers.providers.Web3Provider(window.ethereum);
    console.log('mm provider is: ', provider);
    if (provider && accounts.length > 0) {
      console.log('setting provider');
      provider.next(ethProvider);
    } else {
      this.userService.setUser(null);
    }
  }

  async callDeposit({
    ethInboundAddress,
    asset,
    input,
    memo,
    userAddress,
    signer,
  }: MetaMaskDepositParams): Promise<string> {
    const gasPrice = baseAmount(
      ethers.utils.parseUnits(ethInboundAddress.gas_rate, 'gwei').toString(),
      ETH_DECIMAL
    )
      .amount()
      .toFixed(0);

    let hash: string;
    let decimal: number;
    const vaultContract = new ethers.Contract(ethInboundAddress.router, TCAbi);

    if (asset.symbol === 'ETH') {
      decimal = ETH_DECIMAL;
    } else {
      const tokenAddress = getTokenAddress(asset);
      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
      decimal = await tokenContract.decimals();
    }

    let amount = assetToBase(assetAmount(input, decimal)).amount();
    let resp: ethers.providers.TransactionResponse;

    if (asset.ticker === 'ETH') {
      const unsignedTx = await vaultContract.populateTransaction.deposit(
        ethInboundAddress.address,
        '0x0000000000000000000000000000000000000000',
        amount.toFixed(),
        memo,
        { from: userAddress, value: amount.toFixed(), gasPrice }
      );
      resp = await signer.sendTransaction(unsignedTx);
    } else {
      const assetAddress = asset.symbol.slice(asset.ticker.length + 1);
      const strip0x = assetAddress.substr(2);
      const checkSummedAddress = ethers.utils.getAddress(strip0x);
      const params = [
        ethInboundAddress.address, // vault
        checkSummedAddress, // asset
        amount.toFixed(), // amount
        memo,
      ];
      const unsignedTx = await vaultContract.populateTransaction.deposit(
        ...params,
        { from: userAddress, gasPrice }
      );
      resp = await signer.sendTransaction(unsignedTx);
      console.log('resp is: ', resp);
    }

    // prettier-ignore
    hash = typeof(resp) === 'string' ? resp : resp?.hash || '';
    return hash;
  }

  async init(): Promise<void> {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const lastLoginType = localStorage.getItem('lastLoginType');
    if (provider && lastLoginType === 'metamask') {
      this._provider.next(provider);
    } else {
      this._provider.next(null);
    }
  }

  async connect() {
    return await window.ethereum.enable();
  }
}
