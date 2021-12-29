import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { getChainAsset } from 'src/app/_classes/asset';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { PoolAddressDTO } from 'src/app/_classes/pool-address';
import { User } from 'src/app/_classes/user';
import { addressIsBlockListed, ETH_BLOCKLIST } from 'src/app/_const/blocklist';
import { MidgardService } from 'src/app/_services/midgard.service';
import { TransactionUtilsService } from 'src/app/_services/transaction-utils.service';
import { UserService } from 'src/app/_services/user.service';

@Component({
  selector: 'app-send-asset',
  templateUrl: './send-asset.component.html',
  styleUrls: ['./send-asset.component.scss'],
})
export class SendAssetComponent implements OnInit, OnDestroy {
  @Output() back: EventEmitter<null>;
  @Output() confirmSend: EventEmitter<{
    amount: number;
    recipientAddress: string;
    memo: string;
  }>;
  @Input() asset: AssetAndBalance;

  get amount() {
    return this._amount;
  }
  set amount(val: number) {
    this._amount = val;
    this.checkSpendable();
  }
  private _amount: number;
  recipientAddress: string;
  chainBalance: number;
  balance: number;
  amountSpendable: boolean;
  user: User;
  subs: Subscription[];
  memo: string;
  inboundAddresses: PoolAddressDTO[];

  constructor(
    private userService: UserService,
    private midgardService: MidgardService,
    private txUtilsService: TransactionUtilsService
  ) {
    this.recipientAddress = '';
    this.memo = '';
    this.back = new EventEmitter<null>();
    this.confirmSend = new EventEmitter<{
      amount: number;
      recipientAddress: string;
      memo: string;
    }>();
    this.amountSpendable = false;
  }

  ngOnInit(): void {
    this.setInboundAddresses();

    if (this.asset) {
      const balances$ = this.userService.userBalances$.subscribe((balances) => {
        this.balance = this.userService.findBalance(balances, this.asset.asset);

        this.chainBalance = this.userService.findBalance(
          balances,
          getChainAsset({
            chain: this.asset?.asset.chain,
            isSynth: this.asset?.asset.isSynth,
          })
        );
      });

      const user$ = this.userService.user$.subscribe((user) => {
        this.user = user;
      });

      this.subs = [balances$, user$];
    }
  }

  setInboundAddresses() {
    this.midgardService.getInboundAddresses().subscribe({
      next: (res) => (this.inboundAddresses = res),
    });
  }

  nextDisabled(): boolean {
    if (!this.user) {
      return true;
    }

    if (!this.asset) {
      return true;
    }

    const client = this.userService.getChainClient(
      this.user,
      this.asset.asset.chain
    );
    if (!client) {
      return true;
    }

    if (!this.inboundAddresses || !this.asset || !this.chainBalance) {
      return true;
    }

    if (
      this.chainBalance <
      this.txUtilsService.calculateNetworkFee(
        getChainAsset({
          chain: this.asset.asset.chain,
          isSynth: this.asset.asset.isSynth,
        }),
        this.inboundAddresses,
        'EXTERNAL'
      )
    ) {
      return true;
    }

    // malicious ETH address
    if (
      this.asset.asset.chain === 'ETH' &&
      addressIsBlockListed({
        address: this.recipientAddress,
        blocklist: ETH_BLOCKLIST,
      })
    ) {
      return true;
    }

    return (
      !this.amountSpendable ||
      !client.validateAddress(this.recipientAddress) ||
      this.amount <= 0
    );
  }

  mainButtonText(): string {
    if (!this.user) {
      return 'Connect Wallet';
    }

    if (!this.inboundAddresses || !this.asset || !this.chainBalance) {
      return 'Loading';
    }

    const client = this.userService.getChainClient(
      this.user,
      this.asset.asset.chain
    );
    if (!client) {
      return `No ${this.asset.asset.chain} Client Found`;
    }

    if (!client.validateAddress(this.recipientAddress)) {
      return `Invalid ${this.asset.asset.chain} Address`;
    }

    // malicious ETH address
    if (
      this.asset.asset.chain === 'ETH' &&
      addressIsBlockListed({
        address: this.recipientAddress,
        blocklist: ETH_BLOCKLIST,
      })
    ) {
      return 'Malicious Address Detected';
    }

    if (this.amount <= 0) {
      return 'Enter Amount';
    }

    /** Insufficient Chain balance */
    if (
      this.chainBalance <
      this.txUtilsService.calculateNetworkFee(
        getChainAsset({
          chain: this.asset.asset.chain,
          isSynth: this.asset.asset.isSynth,
        }),
        this.inboundAddresses,
        'EXTERNAL'
      )
    ) {
      return `Insufficient ${this.asset.asset.chain}`;
    }

    if (!this.amountSpendable) {
      return 'Amount not spendable';
    }

    return 'Next';
  }

  checkSpendable(): void {
    const maximumSpendableBalance = this.userService.maximumSpendableBalance(
      this.asset.asset,
      this.balance,
      this.inboundAddresses,
      'EXTERNAL'
    );
    this.amountSpendable = this.amount <= maximumSpendableBalance;
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}
