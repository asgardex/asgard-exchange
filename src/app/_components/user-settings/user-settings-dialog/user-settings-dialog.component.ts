import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Chain } from '@thorchain/asgardex-util';
import { Subscription } from 'rxjs';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { User } from 'src/app/_classes/user';
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
  mode: 'ADDRESSES' | 'ADDRESS' | 'PENDING_TXS' | 'ASSET' | 'SEND' | 'CONFIRM_SEND'| 'PROCESSING' | 'SUCCESS';
  selectedAddress: string;
  selectedChain: Chain;
  selectedAsset: AssetAndBalance;
  amountToSend: number;
  recipient: string;

  @Input() userSetting: boolean;
  @Output() userSettingChange = new EventEmitter<boolean>();

  constructor(
    private userService: UserService,
    private txStatusService: TransactionStatusService,
    // public dialogRef: MatDialogRef<UserSettingsDialogComponent>
  ) {

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

  selectAddress(address: string, chain: Chain) {
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

  disconnect() {
    this.userService.setUser(null);
    this.userSettingChange.emit(!this.userSetting);
    // this.dialogRef.close();
  }

  ngOnDestroy(): void {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
