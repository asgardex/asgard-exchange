import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { assetAmount, assetToBase } from '@xchainjs/xchain-util';
import { Subscription } from 'rxjs';

import { Asset } from 'src/app/_classes/asset';
import { User } from 'src/app/_classes/user';
import { UserService } from 'src/app/_services/user.service';

@Component({
  selector: 'app-retry-rune-deposit',
  templateUrl: './retry-rune-deposit.component.html',
  styleUrls: ['./retry-rune-deposit.component.scss']
})
export class RetryRuneDepositComponent implements OnInit, OnDestroy {

  @Input() asset: Asset;
  @Input() assetAmount: number;
  @Input() runeAmount: number;
  @Input() user: User;
  @Input() errorMessage: string;
  @Output() retrySuccess: EventEmitter<string>;
  @Output() withdrawSuccess: EventEmitter<string>;

  rune: Asset;
  loading: boolean;
  runeBalance: number;
  resubmitError: string;
  subs: Subscription[];
  processingMessage: string;

  constructor(private userService: UserService) {
    this.rune = new Asset('THOR.RUNE');
    this.retrySuccess = new EventEmitter<string>();
    this.withdrawSuccess = new EventEmitter<string>();
    this.processingMessage = '';

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => this.runeBalance = this.userService.findBalance(
        balances, this.rune
      )
    );

    this.subs = [balances$];

  }

  ngOnInit(): void {
    this.userService.fetchBalances();
  }

  async resubmitRuneDeposit() {

    this.processingMessage = 'Resubmitting RUNE Deposit';
    this.loading = true;
    this.resubmitError = null;

    // deposit RUNE
    try {

      const thorClient = this.user.clients.thorchain;

      // get token address
      const address = this.userService.getTokenAddress(this.user, this.asset.chain);
      if (!address || address === '') {
        console.error('no address found');
        return;
      }

      const runeMemo = `+:${this.asset.chain}.${this.asset.symbol}:${address}`;

      const runeHash = await thorClient.deposit({
        amount: assetToBase(assetAmount(this.runeAmount)),
        memo: runeMemo,
      });

      this.retrySuccess.next(runeHash);

    } catch (error) {
      console.error('error retrying RUNE transfer: ', error);
      this.resubmitError = error;
    }

    this.loading = false;

  }

  async withdrawPendingDeposit() {
    this.processingMessage = `Withdrawing ${this.asset.ticker}`;
    this.loading = true;

    const thorClient = this.user.clients.thorchain;
    if (!thorClient) {
      console.error('no thor client found!');
      return;
    }

    const txCost = assetToBase(assetAmount(0.00000001));

    // unstake 100%
    const memo = `WITHDRAW:${this.asset.chain}.${this.asset.symbol}:100`;

    // withdraw RUNE
    try {
      const hash = await thorClient.deposit({
        amount: txCost,
        memo,
      });

      this.withdrawSuccess.next(hash);

    } catch (error) {
      console.error('error retrying RUNE transfer: ', error);
      this.resubmitError = error;
    }
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
