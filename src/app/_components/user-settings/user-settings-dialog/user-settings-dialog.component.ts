import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { User } from 'src/app/_classes/user';
import { AvailableChain } from 'src/app/_const/available-chain';
import { TransactionStatusService } from 'src/app/_services/transaction-status.service';
import { UserService } from 'src/app/_services/user.service';

@Component({
  selector: 'app-user-settings-dialog',
  templateUrl: './user-settings-dialog.component.html',
  styleUrls: ['./user-settings-dialog.component.scss']
})
export class UserSettingsDialogComponent implements OnInit, OnDestroy {

  user: User;
  subs: Subscription[];
  binanceAddress: string;
  bitcoinAddress: string;
  thorAddress: string;
  loading: boolean;
  pendingTxCount: number;
  mode: 'ADDRESSES' | 'ADDRESS' | 'PENDING_TXS' | 'ASSET' | 'SEND' | 'CONFIRM_SEND';
  selectedAddress: string;
  selectedChain: AvailableChain;
  selectedAsset: AssetAndBalance;
  amountToSend: number;
  recipient: string;

  constructor(private userService: UserService, private txStatusService: TransactionStatusService) {

    this.pendingTxCount = 0;
    this.mode = 'ADDRESSES';

    const user$ = this.userService.user$.subscribe(
      async (user) => {

        if (user) {

          this.loading = true;

          this.user = user;
          this.thorAddress = user.wallet;

          if (this.user.clients && this.user.clients.binance) {
            this.binanceAddress = await this.user.clients.binance.getAddress();
          }

          if (this.user.clients && this.user.clients.bitcoin) {
            this.bitcoinAddress = await this.user.clients.bitcoin.getAddress();
          }

          this.loading = false;

        }

      }
    );

    const txs$ = this.txStatusService.txs$.subscribe( (_) => {
      this.pendingTxCount = this.txStatusService.getPendingTxCount();
    });

    this.subs = [user$, txs$];
  }

  ngOnInit(): void {
  }

  selectAddress(address: string, chain: AvailableChain) {
    this.selectedAddress = address;
    this.selectedChain = chain;
    this.mode = 'ADDRESS';
  }

  clearSelectedAddress() {
    this.selectedAddress = null;
    this.selectedChain = null;
    this.mode = 'ADDRESSES';
  }

  selectAsset(asset: AssetAndBalance) {
    this.selectedAsset = asset;
    this.mode = 'ASSET';
  }

  confirmSend(p: {amount: number, recipientAddress: string}) {
    this.amountToSend = p.amount;
    this.recipient = p.recipientAddress;
    this.mode = 'CONFIRM_SEND';
  }

  clearSelectedAsset() {
    this.selectedAsset = null;
    this.mode = 'ADDRESS';
  }

  transactionSuccessful() {
    this.mode = 'PENDING_TXS';
    this.amountToSend = null;
    this.recipient = null;
    this.selectedAsset = null;
    this.selectedAddress = null;
  }

  ngOnDestroy(): void {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
