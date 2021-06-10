import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { assetToString } from '@xchainjs/xchain-util';
import { Subscription } from 'rxjs';
import { PoolAddressDTO } from 'src/app/_classes/pool-address';
import { User } from 'src/app/_classes/user';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { MidgardService } from 'src/app/_services/midgard.service';
import { UserService } from 'src/app/_services/user.service';
import {
  TransactionStatusService,
  TxActions,
  TxStatus,
} from 'src/app/_services/transaction-status.service';
import { EthUtilsService } from 'src/app/_services/eth-utils.service';
import { Balances } from '@xchainjs/xchain-client';
import { KeystoreDepositService } from 'src/app/_services/keystore-deposit.service';
import { Asset } from 'src/app/_classes/asset';
import { PoolTypeOption } from 'src/app/_const/pool-type-options';
import { Client } from '@xchainjs/xchain-thorchain';

export interface ConfirmDepositData {
  asset;
  rune;
  assetAmount: number;
  runeAmount: number;
  user: User;
  runeBasePrice: number;
  assetBasePrice: number;
  estimatedFee: number;
  runeFee: number;
  poolTypeOption: PoolTypeOption;
}

@Component({
  selector: 'app-confirm-deposit-modal',
  templateUrl: './confirm-deposit-modal.component.html',
  styleUrls: ['./confirm-deposit-modal.component.scss'],
})
export class ConfirmDepositModalComponent implements OnInit, OnDestroy {
  txState: TransactionConfirmationState | 'RETRY_RUNE_DEPOSIT';
  hash: string;
  subs: Subscription[];
  error: string;
  insufficientChainBalance: boolean;
  loading: boolean;
  estimatedMinutes: number;
  balances: Balances;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDepositData,
    public dialogRef: MatDialogRef<ConfirmDepositModalComponent>,
    private txStatusService: TransactionStatusService,
    private midgardService: MidgardService,
    private ethUtilsService: EthUtilsService,
    private userService: UserService,
    private keystoreDepositService: KeystoreDepositService
  ) {
    this.loading = true;
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;
    const user$ = this.userService.user$.subscribe((user) => {
      if (!user) {
        this.closeDialog();
      }
    });

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => (this.balances = balances)
    );

    this.subs = [user$, balances$];
  }

  ngOnInit(): void {
    this.estimateTime();
    this.loading = false;
  }

  async estimateTime() {
    if (this.data.asset.chain === 'ETH' && this.data.asset.symbol !== 'ETH') {
      this.estimatedMinutes = await this.ethUtilsService.estimateERC20Time(
        assetToString(this.data.asset),
        this.data.assetAmount
      );
    } else {
      this.estimatedMinutes = this.txStatusService.estimateTime(
        this.data.asset.chain,
        this.data.assetAmount
      );
    }
  }

  submitTransaction(): void {
    this.txState = TransactionConfirmationState.SUBMITTING;

    this.midgardService.getInboundAddresses().subscribe(async (res) => {
      if (res && res.length > 0) {
        this.deposit(res);
      }
    });
  }

  async depositAsset(pools: PoolAddressDTO[]): Promise<string> {
    const clients = this.data.user.clients;
    const thorClient = clients.thorchain;
    const thorchainAddress = await thorClient.getAddress();
    let hash = '';

    // get token address
    const address = this.userService.getTokenAddress(
      this.data.user,
      this.data.asset.chain
    );
    if (!address || address === '') {
      console.error('no address found');
      return;
    }

    // find recipient pool
    const recipientPool = pools.find(
      (pool) => pool.chain === this.data.asset.chain
    );
    if (!recipientPool) {
      console.error('no recipient pool found');
      return;
    }

    // Deposit token
    try {
      // deposit using xchain
      switch (this.data.asset.chain) {
        case 'BNB':
          hash = await this.keystoreDepositService.binanceDeposit({
            asset: this.data.asset as Asset,
            inputAmount: this.data.assetAmount,
            client: this.data.user.clients.binance,
            poolType: this.data.poolTypeOption,
            thorchainAddress,
            recipientPool,
          });
          break;

        case 'BTC':
          hash = await this.keystoreDepositService.bitcoinDeposit({
            asset: this.data.asset as Asset,
            inputAmount: this.data.assetAmount,
            client: this.data.user.clients.bitcoin,
            balances: this.balances,
            thorchainAddress,
            recipientPool,
            estimatedFee: this.data.estimatedFee,
            poolType: this.data.poolTypeOption,
          });
          break;

        case 'LTC':
          hash = await this.keystoreDepositService.litecoinDeposit({
            asset: this.data.asset as Asset,
            inputAmount: this.data.assetAmount,
            client: this.data.user.clients.litecoin,
            balances: this.balances,
            thorchainAddress,
            recipientPool,
            estimatedFee: this.data.estimatedFee,
            poolType: this.data.poolTypeOption,
          });
          break;

        case 'BCH':
          hash = await this.keystoreDepositService.bchDeposit({
            asset: this.data.asset as Asset,
            inputAmount: this.data.assetAmount,
            client: this.data.user.clients.bitcoinCash,
            balances: this.balances,
            thorchainAddress,
            recipientPool,
            estimatedFee: this.data.estimatedFee,
            poolType: this.data.poolTypeOption,
          });

          break;

        case 'ETH':
          hash = await this.keystoreDepositService.ethereumDeposit({
            asset: this.data.asset as Asset,
            inputAmount: this.data.assetAmount,
            balances: this.balances,
            client: this.data.user.clients.ethereum,
            thorchainAddress,
            recipientPool,
            poolType: this.data.poolTypeOption,
          });
          break;

        default:
          console.error(`${this.data.asset.chain} does not match`);
          return;
      }

      if (hash === '') {
        console.error('no hash set');
        return;
      }
      return hash;
    } catch (error) {
      console.error('error making token transfer: ', error);
      this.txState = TransactionConfirmationState.ERROR;
      this.error = error;
      return;
    }
  }

  async depositRune(thorClient: Client, asset: Asset): Promise<string> {
    // deposit RUNE
    try {
      const address = this.userService.getTokenAddress(
        this.data.user,
        this.data.asset.chain
      );
      if (!address || address === '') {
        throw new Error('No Address Found');
      }

      const runeHash = await this.keystoreDepositService.runeDeposit({
        client: thorClient,
        inputAmount: this.data.runeAmount,
        memo:
          this.data.poolTypeOption === 'SYM'
            ? `+:${asset.chain}.${asset.symbol}:${address}`
            : `+:${asset.chain}.${asset.symbol}`,
      });

      return runeHash;
    } catch (error) {
      console.error('error making RUNE transfer: ', error);
      this.txState = 'RETRY_RUNE_DEPOSIT';
      this.error = error;
      return;
    }
  }

  async deposit(pools: PoolAddressDTO[]) {
    const clients = this.data.user.clients;
    const thorClient = clients.thorchain;
    let assetHash = '';

    switch (this.data.poolTypeOption) {
      case 'SYM':
        try {
          assetHash = await this.depositAsset(pools);
          console.log('asset hash is: ', assetHash);
          this.assetDepositSuccess(this.data.asset, assetHash);
        } catch (error) {
          console.error('error making token transfer: ', error);
          this.txState = TransactionConfirmationState.ERROR;
          this.error = error;
          return;
        }

        if (!assetHash || assetHash.length <= 0) {
          this.assetDepositError('Deposit Unsuccessful');
          return;
        }

        try {
          const runeHash = await this.depositRune(thorClient, this.data.asset);
          console.log('rune hash is: ', runeHash);
          this.runeDepositSuccess(runeHash);
        } catch (error) {
          console.error('error making RUNE transfer: ', error);
          this.txState = 'RETRY_RUNE_DEPOSIT';
          this.error = error;
          return;
        }
        break;

      case 'ASYM_ASSET':
        try {
          assetHash = await this.depositAsset(pools);
          this.hash = assetHash;

          if (!assetHash || assetHash.length <= 0) {
            this.assetDepositError('Deposit Unsuccessful');
            return;
          }

          console.log('asset hash is: ', assetHash);
          this.assetDepositSuccess(this.data.asset, assetHash);
          this.txState = TransactionConfirmationState.SUCCESS;
        } catch (error) {
          console.error('error making token transfer: ', error);
          this.txState = TransactionConfirmationState.ERROR;
          this.error = error;
          return;
        }
        break;

      case 'ASYM_RUNE':
        // const assetHash = await this.assetDeposit(pools);
        try {
          const runeHash = await this.depositRune(thorClient, this.data.asset);
          console.log('rune hash is: ', runeHash);
          this.runeDepositSuccess(runeHash);
          break;
        } catch (error) {
          console.error('error making RUNE transfer: ', error);
          this.txState = 'RETRY_RUNE_DEPOSIT';
          this.error = error;
          return;
        }
    }
  }

  assetDepositError(error: string) {
    this.txState = TransactionConfirmationState.ERROR;
    this.error = error;
  }

  assetDepositSuccess(asset: Asset, hash: string) {
    this.txStatusService.addTransaction({
      chain: asset.chain,
      hash,
      ticker: `${this.data.asset.ticker}`,
      status: TxStatus.PENDING,
      action: TxActions.DEPOSIT,
      symbol: this.data.asset.symbol,
      isThorchainTx: true,
    });
  }

  runeDepositSuccess(runeHash: string) {
    this.hash = runeHash;
    this.txStatusService.addTransaction({
      chain: 'THOR',
      hash: runeHash,
      ticker: `RUNE`,
      status: TxStatus.PENDING,
      action: TxActions.DEPOSIT,
      symbol: this.data.asset.symbol,
      isThorchainTx: true,
    });
    this.txState = TransactionConfirmationState.SUCCESS;
  }

  withdrawSuccess(hash: string) {
    this.hash = hash;
    this.txStatusService.addTransaction({
      chain: 'THOR',
      hash,
      ticker: `${this.data.asset.ticker}-RUNE`,
      status: TxStatus.PENDING,
      action: TxActions.WITHDRAW,
      symbol: this.data.asset.symbol,
      isThorchainTx: true,
      pollThornodeDirectly: true,
    });
    this.txState = TransactionConfirmationState.SUCCESS;
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
