import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Chain } from '@xchainjs/xchain-util';
import { Subscription } from 'rxjs';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { PoolDTO } from 'src/app/_classes/pool';
import { User } from 'src/app/_classes/user';
import { MetamaskService } from 'src/app/_services/metamask.service';
import { MidgardService } from 'src/app/_services/midgard.service';
import { TransactionStatusService } from 'src/app/_services/transaction-status.service';
import { UserService } from 'src/app/_services/user.service';

@Component({
  selector: 'app-user-settings-dialog',
  templateUrl: './user-settings-dialog.component.html',
  styleUrls: ['./user-settings-dialog.component.scss'],
})
export class UserSettingsDialogComponent implements OnInit, OnDestroy {
  user: User;
  subs: Subscription[];
  binanceAddress: string;
  bitcoinAddress: string;
  thorAddress: string;
  ethereumAddress: string;
  litecoinAddress: string;
  bchAddress: string;
  loading: boolean;
  pendingTxCount: number;
  mode:
    | 'ADDRESSES'
    | 'ADDRESS'
    | 'PENDING_TXS'
    | 'ASSET'
    | 'SEND'
    | 'CONFIRM_SEND'
    | 'UPGRADE_RUNE'
    | 'CONFIRM_UPGRADE_RUNE'
    | 'VIEW_PHRASE'
    | 'DEPOSIT'
    | 'CONFIRM_DEPOSIT'
    | 'ADDRESS_ADD_TOKEN';
  selectedAddress: string;
  selectedChain: string;
  selectedAsset: AssetAndBalance;
  amountToSend: number;
  recipient: string;
  pools: PoolDTO[];
  memo: string;

  constructor(
    private userService: UserService,
    private txStatusService: TransactionStatusService,
    private midgardService: MidgardService,
    private transactionStatusService: TransactionStatusService,
    public dialogRef: MatDialogRef<UserSettingsDialogComponent>,
    private metaMaskService: MetamaskService
  ) {
    this.pools = [];
    this.pendingTxCount = 0;
    this.mode = 'ADDRESSES';

    const user$ = this.userService.user$.subscribe(async (user) => {
      if (user) {
        this.loading = true;

        this.user = user;

        if (this.user.clients) {
          this.binanceAddress = await this.user.clients.binance.getAddress();
          this.bitcoinAddress = await this.user.clients.bitcoin.getAddress();
          this.thorAddress = await this.user.clients.thorchain.getAddress();
          this.ethereumAddress = await this.user.clients.ethereum.getAddress();
          this.litecoinAddress = await this.user.clients.litecoin.getAddress();
          this.bchAddress = await this.user.clients.bitcoinCash.getAddress();
        }

        this.loading = false;
      } else {
        this.pendingTxCount = 0;
      }
    });

    const txs$ = this.txStatusService.txs$.subscribe((_) => {
      this.pendingTxCount = this.txStatusService.getPendingTxCount();
    });

    this.subs = [user$, txs$];
  }

  ngOnInit(): void {
    this.getPools();
  }

  getPools() {
    this.midgardService.getPools().subscribe((res) => (this.pools = res));
  }

  selectAddress(address: string, chain: string) {
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

  confirmSend(p: { amount: number; recipientAddress: string; memo: string }) {
    this.amountToSend = p.amount;
    this.recipient = p.recipientAddress;
    this.memo = p.memo;
    this.mode = 'CONFIRM_SEND';
  }

  confirmUpgradeRune(p: { amount: number }) {
    this.amountToSend = p.amount;
    this.mode = 'CONFIRM_UPGRADE_RUNE';
  }

  clearSelectedAsset() {
    this.selectedAsset = null;
    this.mode = 'ADDRESS';
  }

  transactionSuccessful() {
    this.mode = 'PENDING_TXS';
    this.amountToSend = null;
    this.recipient = null;
    this.memo = null;
    this.selectedAsset = null;
    this.selectedAddress = null;
  }

  disconnect() {
    localStorage.clear();
    this.userService.setUser(null);
    this.metaMaskService.setProvider(null);
    this.transactionStatusService.clearPendingTransactions();
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}
