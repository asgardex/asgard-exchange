import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { assetAmount, assetToBase, assetToString, baseAmount } from '@xchainjs/xchain-util';
import { Subscription } from 'rxjs';
import { PoolAddressDTO } from 'src/app/_classes/pool-address';
import { User } from 'src/app/_classes/user';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { MidgardService } from 'src/app/_services/midgard.service';
import { UserService } from 'src/app/_services/user.service';
import { TransactionStatusService, TxActions, TxStatus } from 'src/app/_services/transaction-status.service';
import { Client as BinanceClient } from '@xchainjs/xchain-binance';
import { Client as BitcoinClient } from '@xchainjs/xchain-bitcoin';
import { Client as EthereumClient, ETH_DECIMAL } from '@xchainjs/xchain-ethereum/lib';
import { Client as LitecoinClient } from '@xchainjs/xchain-litecoin';
import { Client as BchClient } from '@xchainjs/xchain-bitcoincash';
import { EthUtilsService } from 'src/app/_services/eth-utils.service';

export interface ConfirmDepositData {
  asset;
  rune;
  assetAmount: number;
  runeAmount: number;
  user: User;
  runeBasePrice: number;
  assetBasePrice: number;
}

@Component({
  selector: 'app-confirm-deposit-modal',
  templateUrl: './confirm-deposit-modal.component.html',
  styleUrls: ['./confirm-deposit-modal.component.scss']
})
export class ConfirmDepositModalComponent implements OnInit, OnDestroy {

  txState: TransactionConfirmationState;
  hash: string;
  subs: Subscription[];
  error: string;
  ethNetworkFee: number;
  insufficientChainBalance: boolean;
  loading: boolean;
  estimatedMinutes: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDepositData,
    public dialogRef: MatDialogRef<ConfirmDepositModalComponent>,
    private txStatusService: TransactionStatusService,
    private midgardService: MidgardService,
    private ethUtilsService: EthUtilsService,
    private userService: UserService,
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

    this.subs = [user$];
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
    const address = await this.userService.getTokenAddress(this.data.user, this.data.asset.chain);
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
          const bnbClient = this.data.user.clients.binance;
          hash = await this.binanceDeposit(bnbClient, thorchainAddress, recipientPool);
          break;

        case 'BTC':
          const btcClient = this.data.user.clients.bitcoin;
          hash = await this.bitcoinDeposit(btcClient, thorchainAddress, recipientPool);
          break;

        case 'LTC':
          const ltcClient = this.data.user.clients.litecoin;
          hash = await this.litecoinDeposit(ltcClient, thorchainAddress, recipientPool);
          break;

        case 'BCH':
          const bchClient = this.data.user.clients.bitcoinCash;
          hash = await this.bchDeposit(bchClient, thorchainAddress, recipientPool);
          break;

        case 'ETH':
          const ethClient = this.data.user.clients.ethereum;
          hash = await this.ethereumDeposit(ethClient, thorchainAddress, recipientPool);
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

    // deposit RUNE
    try {
      const runeMemo = `+:${asset.chain}.${asset.symbol}:${address}`;

      const runeHash = await thorClient.deposit({
        amount: assetToBase(assetAmount(this.data.runeAmount)),
        memo: runeMemo,
      });

      this.hash = runeHash;
      this.txStatusService.addTransaction({
        chain: 'THOR',
        hash: runeHash,
        ticker: `${asset.ticker}-RUNE`,
        status: TxStatus.PENDING,
        action: TxActions.DEPOSIT,
        symbol: asset.symbol,
        isThorchainTx: true
      });
    } catch (error) {
      console.error('error making RUNE transfer: ', error);
      this.txState = TransactionConfirmationState.ERROR;
      this.error = error;
    }

    this.txState = TransactionConfirmationState.SUCCESS;

  }

  async ethereumDeposit(client: EthereumClient, thorchainAddress: string, recipientPool: PoolAddressDTO) {
    try {
      const asset = this.data.asset;
      const targetTokenMemo = `+:${asset.chain}.${asset.symbol}:${thorchainAddress}`;
      const hash = await this.ethUtilsService.callDeposit({
        inboundAddress: recipientPool,
        asset,
        memo: targetTokenMemo,
        amount: this.data.assetAmount,
        ethClient: client
      });

      return hash;
    } catch (error) {
      throw(error);
    }
  }

  async binanceDeposit(client: BinanceClient, thorchainAddress: string, recipientPool: PoolAddressDTO): Promise<string> {
    // deposit token
    try {

      const asset = this.data.asset;
      const targetTokenMemo = `+:${asset.chain}.${asset.symbol}:${thorchainAddress}`;
      const hash = await client.transfer({
        asset: {
          chain: asset.chain,
          symbol: asset.symbol,
          ticker: asset.ticker
        },
        amount: assetToBase(assetAmount(this.data.assetAmount)),
        recipient: recipientPool.address,
        memo: targetTokenMemo,
      });

      return hash;
    } catch (error) {
      throw(error);
    }
  }

  async bitcoinDeposit(client: BitcoinClient, thorchainAddress: string, recipientPool: PoolAddressDTO): Promise<string> {
    // deposit token
    try {
      const asset = this.data.asset;
      const targetTokenMemo = `+:${asset.chain}.${asset.symbol}:${thorchainAddress}`;
      const fee = await client.getFeesWithMemo(targetTokenMemo);
      const feeRates = await client.getFeeRates();
      const toBase = assetToBase(assetAmount(this.data.assetAmount));
      const amount = toBase.amount().minus(fee.fast.amount());
      const hash = await client.transfer({
        asset: {
          chain: this.data.asset.chain,
          symbol: this.data.asset.symbol,
          ticker: this.data.asset.ticker
        },
        amount: baseAmount(amount),
        recipient: recipientPool.address,
        memo: targetTokenMemo,
        feeRate: feeRates.average
      });

      return hash;
    } catch (error) {
      throw(error);
    }
  }

  async bchDeposit(client: BchClient, thorchainAddress: string, recipientPool: PoolAddressDTO): Promise<string> {
    // deposit token
    try {
      const asset = this.data.asset;
      const targetTokenMemo = `+:${asset.chain}.${asset.symbol}:${thorchainAddress}`;
      const fee = await client.getFeesWithMemo(targetTokenMemo);
      const feeRates = await client.getFeeRates();
      const toBase = assetToBase(assetAmount(this.data.assetAmount));
      const amount = toBase.amount().minus(fee.fastest.amount());
      const feeRate = feeRates.average;

      const hash = await client.transfer({
        asset: {
          chain: this.data.asset.chain,
          symbol: this.data.asset.symbol,
          ticker: this.data.asset.ticker
        },
        amount: baseAmount(amount),
        recipient: recipientPool.address,
        memo: targetTokenMemo,
        feeRate
      });

      return hash;
    } catch (error) {
      throw(error);
    }
  }

  async litecoinDeposit(client: LitecoinClient, thorchainAddress: string, recipientPool: PoolAddressDTO): Promise<string> {
    // deposit token
    try {
      const asset = this.data.asset;
      const targetTokenMemo = `+:${asset.chain}.${asset.symbol}:${thorchainAddress}`;
      const fee = await client.getFeesWithMemo(targetTokenMemo);
      const feeRates = await client.getFeeRates();
      const toBase = assetToBase(assetAmount(this.data.assetAmount));
      const amount = toBase.amount().minus(fee.fast.amount());
      const feeRate = feeRates.average;

      const hash = await client.transfer({
        asset: {
          chain: this.data.asset.chain,
          symbol: this.data.asset.symbol,
          ticker: this.data.asset.ticker
        },
        amount: baseAmount(amount),
        recipient: recipientPool.address,
        memo: targetTokenMemo,
        feeRate
      });

      return hash;
    } catch (error) {
      throw(error);
    }
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

          const estimatedFeeWei = await this.ethUtilsService.estimateFee({
            sourceAsset,
            ethClient,
            ethInbound,
            inputAmount: this.data.assetAmount,
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
