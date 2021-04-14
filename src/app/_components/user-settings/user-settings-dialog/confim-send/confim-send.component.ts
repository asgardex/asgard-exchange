import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ETH_DECIMAL } from '@xchainjs/xchain-ethereum/lib';
import {
  baseAmount,
  assetToBase,
  assetAmount,
  Asset,
} from '@xchainjs/xchain-util';
import { Subscription } from 'rxjs';
import { erc20ABI } from 'src/app/_abi/erc20.abi';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { User } from 'src/app/_classes/user';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { TransactionStatusService, TxActions, TxStatus } from 'src/app/_services/transaction-status.service';
import { UserService } from 'src/app/_services/user.service';
import { ethers } from 'ethers';
import { Asset as asgrsxAsset } from 'src/app/_classes/asset';
import { Balances } from '@xchainjs/xchain-client';
import { EthUtilsService } from 'src/app/_services/eth-utils.service';
import { MidgardService } from 'src/app/_services/midgard.service';
import { PoolAddressDTO } from 'src/app/_classes/pool-address';

@Component({
  selector: 'app-confim-send',
  templateUrl: './confim-send.component.html',
  styleUrls: ['./confim-send.component.scss']
})
export class ConfimSendComponent implements OnInit, OnDestroy {

  @Input() set asset(asset: AssetAndBalance) {
    this._asset = asset;
  }
  get asset() {
    return this._asset;
  }
  _asset: AssetAndBalance;
  @Input() amount: number;
  @Input() recipientAddress: string;
  @Output() back: EventEmitter<null>;
  @Output() transactionSuccessful: EventEmitter<null>;

  user: User;
  subs: Subscription[];
  txState: TransactionConfirmationState;
  error: string;
  insufficientChainBalance: boolean;
  balances: Balances;
  loading: boolean;

  constructor(
    private userService: UserService,
    private txStatusService: TransactionStatusService,
    private ethUtilsService: EthUtilsService,
    private midgardService: MidgardService
  ) {
    this.back = new EventEmitter<null>();
    this.error = '';
    this.transactionSuccessful = new EventEmitter<null>();
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;
    this.insufficientChainBalance = false;
    this.loading = true;

    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );

    this.subs = [user$];

  }

  ngOnInit(): void {
    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {
        this.balances = balances;
        this.checkSufficientChainBalance();
      }
    );
    this.subs.push(balances$);
  }

  async checkSufficientChainBalance() {
    this.loading = true;
    if (this.balances && this.asset && this.asset.asset.chain === 'BNB') {
      const bnbBalance = this.userService.findBalance(this.balances, new asgrsxAsset('BNB.BNB'));
      this.insufficientChainBalance = bnbBalance < 0.000375;
    } else if (this.balances && this.asset && this.asset.asset.chain === 'ETH'
      && this.user && this.user.clients && this.user.clients.ethereum) {

      const ethClient = this.user.clients.ethereum;
      const decimal = await this.ethUtilsService.getAssetDecimal(this.asset.asset, ethClient);
      const amount = assetToBase(assetAmount(this.amount, decimal));
      const estimateFees = await ethClient.estimateFeesWithGasPricesAndLimits({
        amount,
        recipient: this.recipientAddress,
        asset: this.asset.asset
      });
      const fastest = estimateFees.fees.fastest.amount();
      const ethBalance = this.userService.findBalance(this.balances, new asgrsxAsset('ETH.ETH'));
      this.insufficientChainBalance = ethBalance < fastest.dividedBy(10 ** ETH_DECIMAL).toNumber();

    } else {
      console.log('no asset', this.asset);
    }
    this.loading = false;
  }

  submitTransaction() {

    this.txState = TransactionConfirmationState.SUBMITTING;

    if (this.user.type === 'keystore') {

      this.midgardService.getInboundAddresses().subscribe(
        (addresses) => this.submitKeystoreTransaction(addresses)
      );

    }

  }

  async submitKeystoreTransaction(inboundAddresses: PoolAddressDTO[]) {

    if (this.asset && this.asset.asset) {

          // find recipient pool
      const matchingAddress = inboundAddresses.find( (pool) => pool.chain === this.asset.asset.chain );
      if (!matchingAddress) {
        console.error('no recipient pool found');
        return;
      }

      if (this.asset.asset.chain === 'THOR') {

        const client = this.user.clients.thorchain;
        if (!client) {
          console.error('no thorchain client found');
          return;
        }

        try {
          const fees = await client.getFees();
          const amount = assetToBase(assetAmount(this.amount)).amount().toNumber();
          const hash = await client.transfer({
            amount: baseAmount(amount - fees.average.amount().toNumber()),
            recipient: this.recipientAddress,
          });
          this.pushTxStatus(hash, this.asset.asset, true);
          this.transactionSuccessful.next();
        } catch (error) {
          console.error('error making transfer: ', error);
          this.error = error;
          this.txState = TransactionConfirmationState.ERROR;
        }

      } else if (this.asset.asset.chain === 'BNB') {

        const binanceClient = this.user.clients.binance;

        try {
          const hash = await binanceClient.transfer({
            asset: this.asset.asset,
            amount: assetToBase(assetAmount(this.amount)),
            recipient: this.recipientAddress,
          });
          this.pushTxStatus(hash, this.asset.asset, false);
          this.transactionSuccessful.next();
        } catch (error) {
          console.error('error making transfer: ', error);
          this.error = error;
          this.txState = TransactionConfirmationState.ERROR;
        }

      } else if (this.asset.asset.chain === 'BTC') {

        const bitcoinClient = this.user.clients.bitcoin;

        try {
          const toBase = assetToBase(assetAmount(this.amount));
          const amount = toBase.amount().minus(matchingAddress.gas_rate);

          const hash = await bitcoinClient.transfer({
            amount: baseAmount(amount),
            recipient: this.recipientAddress,
            feeRate: +matchingAddress.gas_rate
          });
          this.pushTxStatus(hash, this.asset.asset, false);
          this.transactionSuccessful.next();
        } catch (error) {
          console.error('error making transfer: ', error);
          this.error = error;
          this.txState = TransactionConfirmationState.ERROR;
        }

      } else if (this.asset.asset.chain === 'BCH') {

        const bchClient = this.user.clients.bitcoinCash;

        try {
          const feeRates = await bchClient.getFeeRates();
          const fees = await bchClient.getFees();
          const toBase = assetToBase(assetAmount(this.amount));
          const amount = toBase.amount().minus(fees.fastest.amount());
          const hash = await bchClient.transfer({
            amount: baseAmount(amount),
            recipient: this.recipientAddress,
            feeRate: feeRates.average
          });
          this.pushTxStatus(hash, this.asset.asset, false);
          this.transactionSuccessful.next();
        } catch (error) {
          console.error('error making transfer: ', error);
          this.error = error;
          this.txState = TransactionConfirmationState.ERROR;
        }

      } else if (this.asset.asset.chain === 'ETH') {

        const ethClient = this.user.clients.ethereum;
        const asset = this.asset.asset;
        let decimal;
        const wallet = ethClient.getWallet();

        if (asset.symbol === 'ETH') {
          decimal = ETH_DECIMAL;
        } else {
          const assetAddress = asset.symbol.slice(asset.ticker.length + 1);
          const strip0x = assetAddress.substr(2);
          const checkSummedAddress = ethers.utils.getAddress(strip0x);
          const tokenContract = new ethers.Contract(checkSummedAddress, erc20ABI, wallet);
          const decimals = await tokenContract.decimals();
          decimal = decimals.toNumber();
        }

        try {
          const hash = await ethClient.transfer({
            asset: {
              chain: asset.chain,
              symbol: asset.symbol,
              ticker: asset.ticker
            },
            amount: assetToBase(assetAmount(this.amount, decimal)),
            recipient: this.recipientAddress,
          });
          this.pushTxStatus(hash, this.asset.asset, false);
          this.transactionSuccessful.next();
        } catch (error) {
          console.error('error making transfer: ', error);
          this.error = error;
          this.txState = TransactionConfirmationState.ERROR;
        }

      } else if (this.asset.asset.chain === 'LTC') {
        const litecoinClient = this.user.clients.litecoin;

        try {

          const feeRates = await litecoinClient.getFeeRates();
          const fees = await litecoinClient.getFees();
          const toBase = assetToBase(assetAmount(this.amount));
          const amount = toBase.amount().minus(fees.fastest.amount());

          const hash = await litecoinClient.transfer({
            amount: baseAmount(amount),
            recipient: this.recipientAddress,
            feeRate: feeRates.average
          });
          this.pushTxStatus(hash, this.asset.asset, false);
          this.transactionSuccessful.next();
        } catch (error) {
          console.error('error making transfer: ', error);
          this.error = error;
          this.txState = TransactionConfirmationState.ERROR;
        }
      }

    }

  }

  pushTxStatus(hash: string, asset: Asset, isThorchainTx: boolean) {
    this.txStatusService.addTransaction({
      chain: asset.chain,
      ticker: asset.ticker,
      status: TxStatus.PENDING,
      action: TxActions.SEND,
      symbol: asset.symbol,
      isThorchainTx,
      hash,
    });
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
