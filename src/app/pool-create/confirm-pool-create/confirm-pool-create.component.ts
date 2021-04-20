import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { assetAmount, assetToBase, baseAmount } from '@xchainjs/xchain-util';
import { Subscription } from 'rxjs';
import { User } from 'src/app/_classes/user';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { MidgardService } from 'src/app/_services/midgard.service';
import { TransactionStatusService, TxActions, TxStatus } from 'src/app/_services/transaction-status.service';
import { UserService } from 'src/app/_services/user.service';
import { Client as BinanceClient } from '@xchainjs/xchain-binance';
import { PoolAddressDTO } from 'src/app/_classes/pool-address';
import { Client as EthereumClient, ETH_DECIMAL } from '@xchainjs/xchain-ethereum/lib';
import { EthUtilsService } from 'src/app/_services/eth-utils.service';
import { Client as LitecoinClient } from '@xchainjs/xchain-litecoin';
import { Client as BchClient } from '@xchainjs/xchain-bitcoincash';
import { Client as BitcoinClient } from '@xchainjs/xchain-bitcoin';
import { Balances } from '@xchainjs/xchain-client';

export interface ConfirmCreatePoolData {
  asset;
  rune;
  assetAmount: number;
  runeAmount: number;
}

@Component({
  selector: 'app-confirm-pool-create',
  templateUrl: './confirm-pool-create.component.html',
  styleUrls: ['./confirm-pool-create.component.scss']
})
export class ConfirmPoolCreateComponent implements OnInit, OnDestroy {

  user: User;
  subs: Subscription[];
  txState: TransactionConfirmationState;
  hash: string;
  error: string;
  networkFee: number;
  loading: boolean;
  insufficientChainBalance: boolean;
  bnbBalance: number;
  balances: Balances;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmCreatePoolData,
    public dialogRef: MatDialogRef<ConfirmPoolCreateComponent>,
    private userService: UserService,
    private midgardService: MidgardService,
    private txStatusService: TransactionStatusService,
    private ethUtilsService: EthUtilsService
  ) {
    this.loading = true;

    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;

    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => this.balances = balances
    );

    this.subs = [user$, balances$];

  }

  ngOnInit(): void {

    if (this.data.asset.chain === 'ETH') {
      this.estimateEthGasPrice();
    } else if (this.data.asset.chain === 'BNB') {

      const balances$ = this.userService.userBalances$.subscribe(
        (balances) => {
          if (balances) {
            const bnbBalance = balances.find( (balance) => balance.asset.chain === 'BNB' && balance.asset.symbol === 'BNB' );
            if (bnbBalance)  {
              this.bnbBalance = bnbBalance.amount.amount().toNumber();
              this.estimateBnbFee();
            }
          }
        }
      );

      this.subs.push(balances$);

    }else {
      this.loading = false;
    }

  }

  submitTransaction(): void {
    this.txState = TransactionConfirmationState.SUBMITTING;

    this.midgardService.getInboundAddresses().subscribe(
      async (res) => {

        const inboundAddresses = res;

        this.keystoreDeposit(inboundAddresses);

      }
    );
  }

  async keystoreDeposit(inboundAddresses: PoolAddressDTO[]) {

    const clients = this.user.clients;
    const asset = this.data.asset;
    const thorClient = clients.thorchain;
    const thorchainAddress = thorClient.getAddress();

    // get token address
    const address = this.userService.getTokenAddress(this.user, this.data.asset.chain);
    if (!address || address === '') {
      console.error('no address found');
      return;
    }

    // find recipient pool
    const recipientPool = inboundAddresses.find( (pool) => pool.chain === this.data.asset.chain );
    if (!recipientPool) {
      console.error('no recipient pool found');
      return;
    }


    let hash = '';

    /**
     * Deposit Token
     */
    try {

      // deposit using xchain
      switch (this.data.asset.chain) {
        case 'BNB':
          const bnbClient = this.user.clients.binance;
          hash = await this.binanceDeposit(bnbClient, thorchainAddress, recipientPool);
          break;

        case 'ETH':
          const ethClient = this.user.clients.ethereum;
          hash = await this.ethereumDeposit(ethClient, thorchainAddress, recipientPool);
          break;


        /** FOR MCCN TESTING */
        case 'BTC':
          const btcClient = this.user.clients.bitcoin;
          hash = await this.bitcoinDeposit(btcClient, thorchainAddress, recipientPool);
          break;

        case 'LTC':
          const ltcClient = this.user.clients.litecoin;
          hash = await this.litecoinDeposit(ltcClient, thorchainAddress, recipientPool);
          break;

        case 'BCH':
          const bchClient = this.user.clients.bitcoinCash;
          hash = await this.bchDeposit(bchClient, thorchainAddress, recipientPool);
          break;
        /** END */

        default:
          console.error(`${this.data.asset.chain} does not match`);
          return;
      }

      if (hash === '') {
        console.error('no hash set');
        return;
      }
    } catch (error) {
      console.error('error depositing asset');
      console.error(error);
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
      this.txStatusService.addTransaction({
        chain: 'THOR',
        hash: runeHash,
        ticker: `${asset.ticker}-RUNE`,
        status: TxStatus.PENDING,
        action: TxActions.DEPOSIT,
        symbol: asset.symbol,
        isThorchainTx: true
      });

      this.txState = TransactionConfirmationState.SUCCESS;

    } catch (error) {
      console.error('error making RUNE transfer: ', error);
      this.txState = TransactionConfirmationState.ERROR;
      this.error = error;
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

  async ethereumDeposit(client: EthereumClient, thorchainAddress: string, recipientPool: PoolAddressDTO) {
    try {
      const asset = this.data.asset;
      const targetTokenMemo = `+:${asset.chain}.${asset.symbol}:${thorchainAddress}`;

      const decimal = await this.ethUtilsService.getAssetDecimal(this.data.asset, client);
      let amount = assetToBase(assetAmount(this.data.assetAmount, decimal)).amount();

      const balanceAmount = this.userService.findRawBalance(this.balances, this.data.asset);
      // const balanceAmount = assetToBase(assetAmount(this.data.asset.balance.amount(), decimal)).amount();

      if (amount.isGreaterThan(balanceAmount)) {
        amount = balanceAmount;
      }

      const hash = await this.ethUtilsService.callDeposit({
        inboundAddress: recipientPool,
        asset,
        memo: targetTokenMemo,
        amount,
        ethClient: client
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

  async estimateBnbFee() {
    this.insufficientChainBalance = (this.bnbBalance && (this.bnbBalance / 10 ** 8 < 0.000375));
    this.networkFee = 0.000375;
    this.loading = false;
  }

  async estimateEthGasPrice() {

    const user = this.user;
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

          this.networkFee = estimatedFeeWei.dividedBy(10 ** ETH_DECIMAL).toNumber();

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
