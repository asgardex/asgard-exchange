import {
  Component,
  Output,
  EventEmitter,
  Input,
  OnDestroy,
} from '@angular/core';
import { Client } from '@xchainjs/xchain-ethereum/lib';
import { Chain } from '@xchainjs/xchain-util';
import { Subscription } from 'rxjs';
import { UserService } from 'src/app/_services/user.service';
import { ethers } from 'ethers';
import { erc20ABI } from 'src/app/_abi/erc20.abi';

@Component({
  selector: 'app-user-address-add-token',
  templateUrl: './user-address-add-token.component.html',
  styleUrls: ['./user-address-add-token.component.scss'],
})
export class UserAddressAddTokenComponent implements OnDestroy {
  @Input() chain: Chain;
  @Input() chainAddress: string;
  @Output() back: EventEmitter<null>;
  tokenAddress: string;
  error: string | null;
  ethClient: Client | null;
  subs: Subscription[];
  loading: boolean;

  constructor(private userService: UserService) {
    this.tokenAddress = '';
    this.back = new EventEmitter<null>();

    const clients$ = this.userService.user$.subscribe((user) => {
      if (user && user.clients && user.clients.ethereum) {
        this.ethClient = user.clients.ethereum;
      }
    });

    this.subs = [clients$];
  }

  async addToken() {
    this.loading = true;

    if (this.ethClient && this.chainAddress) {
      try {
        const wallet = this.ethClient.getWallet();
        const tokenContract = new ethers.Contract(
          this.tokenAddress,
          erc20ABI,
          wallet
        );
        const ticker = await tokenContract.symbol();
        const existingTokens =
          JSON.parse(localStorage.getItem(`${this.chainAddress}_user_added`)) ||
          [];
        const tokenToPush = `${
          this.chain
        }.${ticker}-${this.tokenAddress.toUpperCase()}`;

        if (existingTokens.indexOf(tokenToPush) < 0) {
          existingTokens.push(tokenToPush);
          localStorage.setItem(
            `${this.chainAddress}_user_added`,
            JSON.stringify(existingTokens)
          );
        } else {
          console.log(`token already in localstorage: ${tokenToPush}`);
        }

        this.userService.fetchBalances();

        this.back.emit();
      } catch (error) {
        this.error = error;
      }
    }
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}
