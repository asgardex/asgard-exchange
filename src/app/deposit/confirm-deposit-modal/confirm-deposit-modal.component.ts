import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { assetAmount, assetToBase, assetToString } from '@xchainjs/xchain-util';
import { Subscription } from 'rxjs';
import { PoolAddressDTO } from 'src/app/_classes/pool-address';
import { User } from 'src/app/_classes/user';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { MidgardService } from 'src/app/_services/midgard.service';
import { UserService } from 'src/app/_services/user.service';
import { TransactionStatusService, TxActions, TxStatus } from 'src/app/_services/transaction-status.service';
import { ETH_DECIMAL } from '@xchainjs/xchain-ethereum/lib';
import { EthUtilsService } from 'src/app/_services/eth-utils.service';
import { Balances } from '@xchainjs/xchain-client';
import { KeystoreDepositService } from 'src/app/_services/keystore-deposit.service';
import { Asset } from 'src/app/_classes/asset';

export interface ConfirmDepositData {
  asset;
  rune;
  assetAmount: number;
  runeAmount: number;
  user: User;
  runeBasePrice: number;
  assetBasePrice: number;
  estimatedFee: number;
}

@Component({
  selector: 'app-confirm-deposit-modal',
  templateUrl: './confirm-deposit-modal.component.html',
  styleUrls: ['./confirm-deposit-modal.component.scss']
})
export class ConfirmDepositModalComponent implements OnInit, OnDestroy {

  txState: TransactionConfirmationState | 'RETRY_RUNE_DEPOSIT';
  hash: string;
  subs: Subscription[];
  error: string;
  ethNetworkFee: number;
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
    const user$ = this.userService.user$.subscribe(
      (user) => {
        if (!user) {
          this.closeDialog();
        }
      }
    );

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => this.balances = balances
    );

    this.subs = [user$, balances$];
  }

  ngOnInit(): void {

    this.estimateTime();

    if (this.data.asset.chain === 'ETH') {
      this.estimateEthGasPrice();
    } else {
      this.loading = false;
    }

  }

  async estimateTime() {
    if (this.data.asset.chain === 'ETH' && this.data.asset.symbol !== 'ETH') {
      this.estimatedMinutes = await this.ethUtilsService.estimateERC20Time(assetToString(this.data.asset), this.data.assetAmount);
    } else {
      this.estimatedMinutes = this.txStatusService.estimateTime(this.data.asset.chain, this.data.assetAmount);
    }
  }

  submitTransaction(): void {
    this.txState = TransactionConfirmationState.SUBMITTING;

    this.midgardService.getInboundAddresses().subscribe(
      async (res) => {

        if (res && res.length > 0) {
          this.deposit(res);
        }

      }
    );
  }


  async deposit(pools: PoolAddressDTO[]) {

    const clients = this.data.user.clients;
    const asset = this.data.asset;
    const thorClient = clients.thorchain;
    const thorchainAddress = await thorClient.getAddress();
    let hash = '';

    // get token address
    const address = this.userService.getTokenAddress(this.data.user, this.data.asset.chain);
    if (!address || address === '') {
      console.error('no address found');
      return;
    }

    // find recipient pool
    const recipientPool = pools.find( (pool) => pool.chain === this.data.asset.chain );
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
            thorchainAddress,
            recipientPool
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
            estimatedFee: this.data.estimatedFee
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
            estimatedFee: this.data.estimatedFee
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
            estimatedFee: this.data.estimatedFee
          });

          break;

        case 'ETH':
          hash = await this.keystoreDepositService.ethereumDeposit({
            asset: this.data.asset as Asset,
            inputAmount: this.data.assetAmount,
            balances: this.balances,
            client: this.data.user.clients.ethereum,
            thorchainAddress,
            recipientPool
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

    } catch (error) {
      console.error('error making token transfer: ', error);
      this.txState = TransactionConfirmationState.ERROR;
      this.error = error;
      return;
    }

    console.log('pending hash is: ', hash);

    // testing
    this.txState = 'RETRY_RUNE_DEPOSIT';
    this.error = 'RUNE didnt go through';
    return;


    // deposit RUNE
    try {
      const runeHash = await this.keystoreDepositService.runeDeposit({
        client: thorClient,
        inputAmount: this.data.runeAmount,
        memo: `+:${asset.chain}.${asset.symbol}:${address}`
      });

      this.runeDepositSuccess(runeHash);

    } catch (error) {
      console.error('error making RUNE transfer: ', error);
      this.txState = 'RETRY_RUNE_DEPOSIT';
      this.error = error;
    }

  }

  runeDepositSuccess(runeHash: string) {
    this.hash = runeHash;
    this.txStatusService.addTransaction({
      chain: 'THOR',
      hash: runeHash,
      ticker: `${this.data.asset.ticker}-RUNE`,
      status: TxStatus.PENDING,
      action: TxActions.DEPOSIT,
      symbol: this.data.asset.symbol,
      isThorchainTx: true
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
      pollThornodeDirectly: true
    });
    this.txState = TransactionConfirmationState.SUCCESS;
  }

  async estimateEthGasPrice() {

    const user = this.data.user;
    const sourceAsset = this.data.asset;

    if (user && user.clients && user.clients.ethereum && user.clients.thorchain) {
      const ethClient = user.clients.ethereum;
      const thorClient = user.clients.thorchain;
      const thorchainAddress = await thorClient.getAddress();
      const ethBalances = await ethClient.getBalance();
      const ethBalance = ethBalances[0];

      // get inbound addresses
      this.midgardService.getInboundAddresses().subscribe(
        async (addresses) => {

          const ethInbound = addresses.find( (inbound) => inbound.chain === 'ETH' );
          const decimal = await this.ethUtilsService.getAssetDecimal(this.data.asset, ethClient);
          let amount = assetToBase(assetAmount(this.data.assetAmount, decimal)).amount();
          const balanceAmount = this.userService.findRawBalance(this.balances, this.data.asset);

          if (amount.isGreaterThan(balanceAmount)) {
            amount = balanceAmount;
          }

          const estimatedFeeWei = await this.ethUtilsService.estimateFee({
            sourceAsset,
            ethClient,
            ethInbound,
            inputAmount: amount,
            memo: `+:${sourceAsset.chain}.${sourceAsset.symbol}:${thorchainAddress}`
          });

          this.ethNetworkFee = estimatedFeeWei.dividedBy(10 ** ETH_DECIMAL).toNumber();

          this.insufficientChainBalance = estimatedFeeWei.isGreaterThan(ethBalance.amount.amount());

          this.loading = false;

        }
      );

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
