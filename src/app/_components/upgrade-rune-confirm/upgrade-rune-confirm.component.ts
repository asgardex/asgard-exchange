import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Balances } from '@xchainjs/xchain-client';
import { ETH_DECIMAL } from '@xchainjs/xchain-ethereum';
import { assetAmount, assetToBase } from '@xchainjs/xchain-util';
import { Subscription } from 'rxjs';
import { Asset } from 'src/app/_classes/asset';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { PoolAddressDTO } from 'src/app/_classes/pool-address';
import { User } from 'src/app/_classes/user';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { EthUtilsService } from 'src/app/_services/eth-utils.service';
import { MidgardService } from 'src/app/_services/midgard.service';
import { TransactionStatusService, TxActions, TxStatus } from 'src/app/_services/transaction-status.service';
import { UserService } from 'src/app/_services/user.service';

@Component({
  selector: 'app-upgrade-rune-confirm',
  templateUrl: './upgrade-rune-confirm.component.html',
  styleUrls: ['./upgrade-rune-confirm.component.scss']
})
export class UpgradeRuneConfirmComponent implements OnInit, OnDestroy {

  @Input() asset: AssetAndBalance;
  @Input() amount: number;
  @Output() back: EventEmitter<null>;
  @Output() transactionSuccessful: EventEmitter<string>;
  txState: TransactionConfirmationState;
  user: User;
  subs: Subscription[];
  hash: string;
  runeBalance: number;
  insufficientChainBalance: boolean;
  balances: Balances;
  ethNetworkFee: number;
  loading: boolean;

  constructor(
    private midgardService: MidgardService,
    private userService: UserService,
    private txStatusService: TransactionStatusService,
    private ethUtilsService: EthUtilsService
  ) {
    this.loading = true;
    this.insufficientChainBalance = false;
    this.back = new EventEmitter<null>();
    this.transactionSuccessful = new EventEmitter<string>();
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;

    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {
        this.balances = balances;
        const runeBalance = this.userService.findBalance(balances, new Asset('THOR.RUNE'));
        if (runeBalance) {
          this.runeBalance = runeBalance;
        }
      }
    );

    this.subs = [user$, balances$];

  }

  ngOnInit(): void {

    if (this.asset) {
      if (this.asset.asset.chain === 'BNB') {
        const bnbBalance = this.userService.findBalance(this.balances, new Asset('BNB.BNB'));
        this.insufficientChainBalance = bnbBalance < 0.000375;
        this.loading = false;
      } else if (this.asset.asset.chain === 'ETH') {
        this.estimateEthGasPrice();
      } else {
        console.error('no chain match: ', this.asset?.asset);
      }
    }

  }

  async estimateEthGasPrice() {
    const user = this.user;
    const thorchainClient = this.user.clients.thorchain;
    const thorAddress = await thorchainClient.getAddress();

    if (user && user.clients && user.clients.ethereum) {

      const ethClient = user.clients.ethereum;
      const ethBalances = await ethClient.getBalance();
      const ethBalance = ethBalances[0];

      // get inbound addresses
      this.midgardService.getInboundAddresses().subscribe(
        async (addresses) => {

          const ethInbound = addresses.find( (inbound) => inbound.chain === 'ETH' );
          const estimatedFeeWei = await this.ethUtilsService.estimateFee({
            sourceAsset: this.asset.asset,
            ethClient,
            ethInbound,
            inputAmount: this.amount,
            memo: `SWITCH:${thorAddress}`
          });

          this.ethNetworkFee = estimatedFeeWei.dividedBy(10 ** ETH_DECIMAL).toNumber();
          this.insufficientChainBalance = estimatedFeeWei.isGreaterThan(ethBalance.amount.amount());
          this.loading = false;

        }
      );

    }
  }

  submitTransaction() {
    this.txState = TransactionConfirmationState.SUBMITTING;

    this.midgardService.getInboundAddresses().subscribe(
      async (res) => {

        const currentPools = res;

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

      const asset = this.asset.asset;
      const amountNumber = this.amount;
      const thorchainClient = this.user.clients.thorchain;
      const runeAddress = await thorchainClient.getAddress();
      const memo = this.getRuneUpgradeMemo(runeAddress);


      if (thorchainClient && runeAddress && this.user && this.user.clients && amountNumber > 0) {

        if (asset.chain === 'BNB') {

          const client = this.user.clients.binance;

          const hash = await client.transfer({
            asset: this.asset.asset,
            amount: assetToBase(assetAmount(amountNumber)),
            recipient: matchingPool.address,
            memo
          });

          this.hash = hash;
          this.txStatusService.addTransaction({
            chain: asset.chain,
            hash: this.hash,
            ticker: asset.ticker,
            symbol: asset.symbol,
            status: TxStatus.PENDING,
            action: TxActions.UPGRADE_RUNE,
            isThorchainTx: false
          });

          this.userService.pollNativeRuneBalance(this.runeBalance ?? 0);

          this.transactionSuccessful.next(hash);

        } else if (asset.chain === 'ETH') {

          const client = this.user.clients.ethereum;

          const hash = await this.ethUtilsService.callDeposit({
            asset: this.asset.asset,
            inboundAddress: matchingPool,
            memo,
            amount: amountNumber,
            ethClient: client
          });

          this.hash = hash.substr(2);

          this.txStatusService.addTransaction({
            chain: asset.chain,
            hash,
            ticker: asset.ticker,
            symbol: asset.symbol,
            status: TxStatus.PENDING,
            action: TxActions.UPGRADE_RUNE,
            isThorchainTx: false
          });

          this.userService.pollNativeRuneBalance(this.runeBalance ?? 0);

          this.transactionSuccessful.next(hash);

        }

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
