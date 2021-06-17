import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { ReplaySubject } from 'rxjs';
// import { erc20ABI } from '../_abi/erc20.abi';
import { UserService } from './user.service';

declare global {
  interface Window {
    ethereum: any;
  }
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
