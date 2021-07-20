import { Component, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { assetAmount, assetToBase, Chain } from '@xchainjs/xchain-util';
import { Subscription } from 'rxjs';
import { User } from 'src/app/_classes/user';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { MidgardService } from 'src/app/_services/midgard.service';
import {
  TransactionStatusService,
  TxActions,
  TxStatus,
} from 'src/app/_services/transaction-status.service';
import { UserService } from 'src/app/_services/user.service';
import { Client as BinanceClient } from '@xchainjs/xchain-binance';
import { PoolAddressDTO } from 'src/app/_classes/pool-address';
import { Client as EthereumClient } from '@xchainjs/xchain-ethereum/lib';
import { EthUtilsService } from 'src/app/_services/eth-utils.service';
import { Balance } from '@xchainjs/xchain-client';

export interface ConfirmCreatePoolData {
  asset;
  rune;
  assetAmount: number;
  runeAmount: number;
  networkFee: number;
  runeFee: number;
}

@Component({
  selector: 'app-confirm-pool-create',
  templateUrl: './confirm-pool-create.component.html',
  styleUrls: ['./confirm-pool-create.component.scss'],
})
export class ConfirmPoolCreateComponent implements OnDestroy {
  user: User;
  subs: Subscription[];
  txState: TransactionConfirmationState;
  hash: string;
  error: string;
  balances: Balance[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmCreatePoolData,
    public dialogRef: MatDialogRef<ConfirmPoolCreateComponent>,
    private userService: UserService,
    private midgardService: MidgardService,
    private txStatusService: TransactionStatusService,
    private ethUtilsService: EthUtilsService
  ) {
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;

    const user$ = this.userService.user$.subscribe(
      (user) => (this.user = user)
    );

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => (this.balances = balances)
    );

    this.subs = [user$, balances$];
  }

  submitTransaction(): void {
    this.txState = TransactionConfirmationState.SUBMITTING;

    this.midgardService.getInboundAddresses().subscribe(async (res) => {
      const inboundAddresses = res;
      this.keystoreDeposit(inboundAddresses);
    });
  }

  async keystoreDeposit(inboundAddresses: PoolAddressDTO[]) {
    const clients = this.user.clients;
    const asset = this.data.asset;
    const thorClient = clients.thorchain;
    const thorchainAddress = thorClient.getAddress();

    // get token address
    const address = this.userService.getTokenAddress(
      this.user,
      this.data.asset.chain
    );
    if (!address || address === '') {
      console.error('no address found');
      return;
    }

    // find recipient pool
    const recipientPool = inboundAddresses.find(
      (pool) => pool.chain === this.data.asset.chain
    );

    if (!recipientPool) {
      console.error('no recipient pool found');
      return;
    }

    /**
     * Deposit RUNE
     */
    try {
      const runeMemo = `+:${asset.chain}.${asset.symbol}:${address}`;

      const runeHash = await thorClient.deposit({
        amount: assetToBase(assetAmount(this.data.runeAmount)),
        memo: runeMemo,
      });

      this.hash = runeHash;
    } catch (error) {
      console.error('error making RUNE transfer: ', error);
      this.txState = TransactionConfirmationState.ERROR;
      this.error = error;
      return;
    }

    /**
     * Deposit Token
     */
    try {
      let hash = '';
      // deposit using xchain
      switch (this.data.asset.chain) {
        case 'BNB':
          const bnbClient = this.user.clients.binance;
          hash = await this.binanceDeposit(
            bnbClient,
            thorchainAddress,
            recipientPool
          );
          break;

        case 'ETH':
          const ethClient = this.user.clients.ethereum;
          hash = await this.ethereumDeposit(
            ethClient,
            thorchainAddress,
            recipientPool
          );
          break;

        default:
          console.error(`${this.data.asset.chain} does not match`);
          return;
      }

      if (hash === '') {
        this.txState = TransactionConfirmationState.ERROR;
        this.error = 'Error getting hash from asset transaction';
        return;
      }
    } catch (error) {
      console.error(error);
      this.txState = TransactionConfirmationState.ERROR;
      this.error = 'Error depositing asset';
      return;
    }

    this.txStatusService.addTransaction({
      chain: Chain.THORChain,
      hash: this.hash,
      ticker: `${asset.ticker}-RUNE`,
      status: TxStatus.PENDING,
      action: TxActions.DEPOSIT,
      symbol: asset.symbol,
      isThorchainTx: true,
    });
    this.txState = TransactionConfirmationState.SUCCESS;
  }

  async binanceDeposit(
    client: BinanceClient,
    thorchainAddress: string,
    recipientPool: PoolAddressDTO
  ): Promise<string> {
    // deposit token
    try {
      const asset = this.data.asset;
      const targetTokenMemo = `+:${asset.chain}.${asset.symbol}:${thorchainAddress}`;
      const hash = await client.transfer({
        asset: {
          chain: asset.chain,
          symbol: asset.symbol,
          ticker: asset.ticker,
        },
        amount: assetToBase(assetAmount(this.data.assetAmount)),
        recipient: recipientPool.address,
        memo: targetTokenMemo,
      });

      return hash;
    } catch (error) {
      throw error;
    }
  }

  async ethereumDeposit(
    client: EthereumClient,
    thorchainAddress: string,
    recipientPool: PoolAddressDTO
  ) {
    try {
      const asset = this.data.asset;
      const targetTokenMemo = `+:${asset.chain}.${asset.symbol}:${thorchainAddress}`;
      const decimal = await this.ethUtilsService.getAssetDecimal(
        this.data.asset,
        client
      );
      let amount = assetToBase(
        assetAmount(this.data.assetAmount, decimal)
      ).amount();
      const balanceAmount = this.userService.findRawBalance(
        this.balances,
        this.data.asset
      );

      if (amount.isGreaterThan(balanceAmount)) {
        amount = balanceAmount;
      }

      const hash = await this.ethUtilsService.callDeposit({
        inboundAddress: recipientPool,
        asset,
        memo: targetTokenMemo,
        amount,
        ethClient: client,
      });

      return hash;
    } catch (error) {
      throw error;
    }
  }

  closeDialog(transactionSucess?: boolean) {
    this.dialogRef.close(transactionSucess);
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}
