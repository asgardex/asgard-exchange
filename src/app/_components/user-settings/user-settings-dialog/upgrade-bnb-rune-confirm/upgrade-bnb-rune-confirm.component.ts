import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { assetAmount, assetToBase } from '@thorchain/asgardex-util';
import { Subscription } from 'rxjs';
import { Asset } from 'src/app/_classes/asset';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { PoolAddressDTO } from 'src/app/_classes/pool-address';
import { User } from 'src/app/_classes/user';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { MidgardService } from 'src/app/_services/midgard.service';
import { TransactionStatusService, TxActions, TxStatus } from 'src/app/_services/transaction-status.service';
import { UserService } from 'src/app/_services/user.service';

@Component({
  selector: 'app-upgrade-bnb-rune-confirm',
  templateUrl: './upgrade-bnb-rune-confirm.component.html',
  styleUrls: ['./upgrade-bnb-rune-confirm.component.scss']
})
export class UpgradeBnbRuneConfirmComponent implements OnInit, OnDestroy {

  @Input() asset: AssetAndBalance;
  @Input() amount: number;
  @Output() back: EventEmitter<null>;
  @Output() transactionSuccessful: EventEmitter<null>;
  txState: TransactionConfirmationState;
  user: User;
  subs: Subscription[];
  hash: string;
  runeBalance: number;

  constructor(
    private midgardService: MidgardService,
    private userService: UserService,
    private txStatusService: TransactionStatusService,
  ) {
    this.back = new EventEmitter<null>();
    this.transactionSuccessful = new EventEmitter<null>();
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;

    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {
        const runeBalance = this.userService.findBalance(balances, new Asset('THOR.RUNE'));
        if (runeBalance) {
          this.runeBalance = runeBalance;
        }
      }
    );

    this.subs = [user$, balances$];

  }

  ngOnInit(): void {
  }

  submitTransaction() {
    this.txState = TransactionConfirmationState.SUBMITTING;

    this.midgardService.getInboundAddresses().subscribe(
      async (res) => {

        const currentPools = res.current;

        if (currentPools && currentPools.length > 0) {

          const matchingPool = currentPools.find( (pool) => pool.chain === this.asset.asset.chain );

          console.log('matching pool is: ', matchingPool);

          if (matchingPool) {

            if (this.user.type === 'keystore') {
              this.keystoreTransfer(matchingPool);
            } else {
              console.error('no matching user type');
            }

          }

        }

      }
    );
  }

  async keystoreTransfer(matchingPool: PoolAddressDTO) {

    try {

      const amountNumber = this.amount;
      const binanceClient = this.user.clients.binance;
      const thorchainClient = this.user.clients.thorchain;
      const runeAddress = await thorchainClient.getAddress();

      if (thorchainClient && binanceClient && runeAddress && amountNumber > 0) {

        const memo = this.getRuneUpgradeMemo(runeAddress);
        const hash = await binanceClient.transfer({
          asset: this.asset.asset,
          amount: assetToBase(assetAmount(amountNumber)),
          recipient: matchingPool.address,
          memo
        });

        this.hash = hash;
        this.txStatusService.addTransaction({
          chain: 'BNB',
          hash: this.hash,
          ticker: this.asset.asset.ticker,
          status: TxStatus.PENDING,
          action: TxActions.SWAP
        });

        this.userService.pollNativeRuneBalance(this.runeBalance ?? 0);

        this.transactionSuccessful.next();
      } else {
        this.txState = TransactionConfirmationState.ERROR;
      }

    } catch (error) {
      console.error('error making transfer: ', error);
      this.txState = TransactionConfirmationState.ERROR;
    }

  }

  getRuneUpgradeMemo(thorAddress: string): string {
    return `SWITCH:${thorAddress}`;
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
