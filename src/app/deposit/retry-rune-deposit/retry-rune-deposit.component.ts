import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
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
  @Output() closeModal: EventEmitter<null>;

  rune: Asset;
  loading: boolean;
  runeBalance: number;
  resubmitError: string;
  subs: Subscription[];
  processingMessage: string;
  retryCount: number;

  constructor(private userService: UserService, private router: Router) {
    this.rune = new Asset('THOR.RUNE');
    this.retrySuccess = new EventEmitter<string>();
    this.withdrawSuccess = new EventEmitter<string>();
    this.closeModal = new EventEmitter<null>();
    this.processingMessage = '';
    this.retryCount = 0;

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

      this.retryCount++;
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

  navigateDepositSymRecovery() {
    this.router.navigate(['/', 'deposit-sym-recovery']);
    this.closeModal.emit();
  }


  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
