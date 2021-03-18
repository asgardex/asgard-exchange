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
import { CopyService } from 'src/app/_services/copy.service';
import { ExplorerPathsService } from 'src/app/_services/explorer-paths.service';

@Component({
  selector: 'app-confim-send',
  templateUrl: './confim-send.component.html',
  styleUrls: ['./confim-send.component.scss']
})
export class ConfimSendComponent implements OnInit, OnDestroy {

  @Input() asset: AssetAndBalance;
  @Input() amount: number;
  @Input() recipientAddress: string;
  @Output() back: EventEmitter<null>;
  @Output() transactionSuccessful: EventEmitter<null>;
  @Output() message: EventEmitter<string>;

  @Input() mode: 'ADDRESSES' | 'ADDRESS' | 'PENDING_TXS' | 'ASSET' | 'SEND' | 'CONFIRM_SEND'| 'PROCESSING' | 'SUCCESS';
  @Output() modeChange = new EventEmitter();

  user: User;
  subs: Subscription[];
  txState: TransactionConfirmationState;
  hash: string;
  error: string;

  constructor(private userService: UserService, private txStatusService: TransactionStatusService, private copyService: CopyService, private explorerPathsService : ExplorerPathsService) {
    this.back = new EventEmitter<null>();
    this.error = '';
    this.transactionSuccessful = new EventEmitter<null>();
    this.message = new EventEmitter<string>();
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;

    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );

    this.subs = [user$];

    this.getExplorerPath()
  }

  ngOnInit(): void {
  }

  getExplorerPath() {
    if (this.asset && this.asset.asset) {
      let chain = this.asset.asset.chain;
      switch (chain) {
        case 'BTC':
          return `${this.explorerPathsService.bitcoinExplorerUrl}/tx`;

        case 'BNB':
          return `${this.explorerPathsService.binanceExplorerUrl}/tx`;

        case 'THOR':
          return `${this.explorerPathsService.thorchainExplorerUrl}/txs`;

        case 'ETH':
          return `${this.explorerPathsService.ethereumExplorerUrl}/tx`;

        default:
          return '';
      }
    }
  }

  submitTransaction() {
    this.mode = 'PROCESSING';
    this.modeChange.emit(this.mode)
    this.txState = TransactionConfirmationState.SUBMITTING;

    if (this.user.type === 'keystore') {
      this.submitKeystoreTransaction();
    }

  }

  copyToClipboard(hash: string) {
    this.copyService.copyToClipboard(hash);
  }

  async submitKeystoreTransaction() {

    if (this.asset && this.asset.asset) {

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
          this.hash = hash;
          this.pushTxStatus(hash, this.asset.asset, true);
          this.transactionSuccessful.next();
          this.mode = 'SUCCESS';
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
          this.hash = hash;
          this.pushTxStatus(hash, this.asset.asset, false);
          this.transactionSuccessful.next();
          this.mode = 'SUCCESS';
        } catch (error) {
          console.error('error making transfer: ', error);
          this.error = error;
          this.txState = TransactionConfirmationState.ERROR;
        }

      } else if (this.asset.asset.chain === 'BTC') {

        const bitcoinClient = this.user.clients.bitcoin;

        try {

          const feeRates = await bitcoinClient.getFeeRates();
          const fees = await bitcoinClient.getFees();
          const toBase = assetToBase(assetAmount(this.amount));
          const amount = toBase.amount().minus(fees.fast.amount());

          const hash = await bitcoinClient.transfer({
            amount: baseAmount(amount),
            recipient: this.recipientAddress,
            feeRate: feeRates.average
          });
          this.hash = hash;
          this.pushTxStatus(hash, this.asset.asset, false);
          this.transactionSuccessful.next();
          this.mode = 'SUCCESS';
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
          this.hash = hash;
          this.pushTxStatus(hash, this.asset.asset, false);
          this.transactionSuccessful.next();
          this.mode = 'SUCCESS';
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
          this.hash = hash;
          this.pushTxStatus(hash, this.asset.asset, false);
          this.transactionSuccessful.next();
          this.mode = 'SUCCESS';
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
          const amount = toBase.amount().minus(fees.fast.amount());

          const hash = await litecoinClient.transfer({
            amount: baseAmount(amount),
            recipient: this.recipientAddress,
            feeRate: feeRates.average
          });
          this.pushTxStatus(hash, this.asset.asset, false);
          this.transactionSuccessful.next();
          this.mode = 'SUCCESS';
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
