import { Injectable } from '@angular/core';
import { assetAmount, assetToBase, baseAmount } from '@xchainjs/xchain-util';
import { Asset } from '../_classes/asset';
import { PoolAddressDTO } from '../_classes/pool-address';
import { EthUtilsService } from './eth-utils.service';
import { Client } from '@xchainjs/xchain-ethereum/lib';
import { UserService } from './user.service';
import { Balance } from '@xchainjs/xchain-client';
import { Client as BinanceClient } from '@xchainjs/xchain-binance';
import { Client as BitcoinClient } from '@xchainjs/xchain-bitcoin';
import { Client as LitecoinClient } from '@xchainjs/xchain-litecoin';
import { Client as BchClient } from '@xchainjs/xchain-bitcoincash';
import { Client as ThorClient } from '@xchainjs/xchain-thorchain';
import { PoolTypeOption } from '../_const/pool-type-options';

export interface EthDepositParams {
  asset: Asset;
  inputAmount: number;
  client: Client;
  thorchainAddress?: string;
  recipientPool: PoolAddressDTO;
  balances: Balance[];
  poolType: PoolTypeOption;
}

export interface BinanceDepositParams {
  asset: Asset;
  inputAmount: number;
  client: BinanceClient;
  thorchainAddress?: string;
  recipientPool: PoolAddressDTO;
  poolType: PoolTypeOption;
}

export interface BitcoinDepositParams {
  asset: Asset;
  inputAmount: number;
  client: BitcoinClient;
  thorchainAddress?: string;
  recipientPool: PoolAddressDTO;
  balances: Balance[];
  estimatedFee: number;
  poolType: PoolTypeOption;
}

export interface LitecoinDepositParams {
  asset: Asset;
  inputAmount: number;
  client: LitecoinClient;
  thorchainAddress?: string;
  recipientPool: PoolAddressDTO;
  balances: Balance[];
  estimatedFee: number;
  poolType: PoolTypeOption;
}

export interface BchDepositParams {
  asset: Asset;
  inputAmount: number;
  client: BchClient;
  thorchainAddress?: string;
  recipientPool: PoolAddressDTO;
  balances: Balance[];
  estimatedFee: number;
  poolType: PoolTypeOption;
}

export interface RuneDepositParams {
  client: ThorClient;
  inputAmount: number;
  memo: string;
}

@Injectable({
  providedIn: 'root',
})
export class KeystoreDepositService {
  constructor(
    private ethUtilsService: EthUtilsService,
    private userService: UserService
  ) {}

  async ethereumDeposit({
    asset,
    inputAmount,
    balances,
    client,
    thorchainAddress,
    recipientPool,
    poolType,
  }: EthDepositParams): Promise<string> {
    const memo =
      poolType === 'SYM' && thorchainAddress
        ? this._buildDepositMemo(asset, thorchainAddress)
        : this._buildDepositMemo(asset);

    const decimal = await this.ethUtilsService.getAssetDecimal(asset, client);
    let amount = assetToBase(assetAmount(inputAmount, decimal)).amount();

    const balanceAmount = this.userService.findRawBalance(balances, asset);

    if (amount.isGreaterThan(balanceAmount)) {
      amount = balanceAmount;
    }

    const hash = await this.ethUtilsService.callDeposit({
      inboundAddress: recipientPool,
      asset,
      memo,
      amount,
      ethClient: client,
    });

    return hash;
  }

  async binanceDeposit({
    asset,
    inputAmount,
    client,
    thorchainAddress,
    recipientPool,
    poolType,
  }: BinanceDepositParams): Promise<string> {
    const memo =
      poolType === 'SYM' && thorchainAddress
        ? this._buildDepositMemo(asset, thorchainAddress)
        : this._buildDepositMemo(asset);
    const hash = await client.transfer({
      asset: {
        chain: asset.chain,
        symbol: asset.symbol,
        ticker: asset.ticker,
      },
      amount: assetToBase(assetAmount(inputAmount)),
      recipient: recipientPool.address,
      memo,
    });

    return hash;
  }

  async bitcoinDeposit({
    asset,
    inputAmount,
    client,
    balances,
    thorchainAddress,
    recipientPool,
    estimatedFee,
    poolType,
  }: BitcoinDepositParams): Promise<string> {
    const memo =
      poolType === 'SYM' && thorchainAddress
        ? this._buildDepositMemo(asset, thorchainAddress)
        : this._buildDepositMemo(asset);

    // TODO -> consolidate this with BTC, BCH, LTC
    const balanceAmount = this.userService.findRawBalance(balances, asset);
    const toBase = assetToBase(assetAmount(inputAmount));
    const feeToBase = assetToBase(assetAmount(estimatedFee));
    const amount = balanceAmount
      // subtract fee
      .minus(feeToBase.amount())
      // subtract amount
      .minus(toBase.amount())
      .isGreaterThan(0)
      ? toBase.amount() // send full amount, fee can be deducted from remaining balance
      : toBase.amount().minus(feeToBase.amount()); // after deductions, not enough to process, subtract fee from amount

    if (amount.isLessThan(0)) {
      throw new Error('Insufficient funds. Try sending a smaller amount');
    }
    // TODO -> consolidate this with BTC, BCH, LTC

    const hash = await client.transfer({
      asset: {
        chain: asset.chain,
        symbol: asset.symbol,
        ticker: asset.ticker,
      },
      amount: baseAmount(amount),
      recipient: recipientPool.address,
      memo,
      feeRate: +recipientPool.gas_rate,
    });

    return hash;
  }

  async litecoinDeposit({
    asset,
    inputAmount,
    client,
    balances,
    thorchainAddress,
    recipientPool,
    estimatedFee,
    poolType,
  }: LitecoinDepositParams): Promise<string> {
    const memo =
      poolType === 'SYM' && thorchainAddress
        ? this._buildDepositMemo(asset, thorchainAddress)
        : this._buildDepositMemo(asset);

    // TODO -> consolidate this with BTC, BCH, LTC
    const balanceAmount = this.userService.findRawBalance(balances, asset);
    const toBase = assetToBase(assetAmount(inputAmount));
    const feeToBase = assetToBase(assetAmount(estimatedFee));
    const amount = balanceAmount
      // subtract fee
      .minus(feeToBase.amount())
      // subtract amount
      .minus(toBase.amount())
      .isGreaterThan(0)
      ? toBase.amount() // send full amount, fee can be deducted from remaining balance
      : toBase.amount().minus(feeToBase.amount()); // after deductions, not enough to process, subtract fee from amount

    if (amount.isLessThan(0)) {
      throw new Error('Insufficient funds. Try sending a smaller amount');
    }
    // TODO -> consolidate this with BTC, BCH, LTC

    const hash = await client.transfer({
      asset: {
        chain: asset.chain,
        symbol: asset.symbol,
        ticker: asset.ticker,
      },
      amount: baseAmount(amount),
      recipient: recipientPool.address,
      memo,
      feeRate: +recipientPool.gas_rate,
    });

    return hash;
  }

  async bchDeposit({
    asset,
    inputAmount,
    client,
    balances,
    thorchainAddress,
    recipientPool,
    estimatedFee,
    poolType,
  }: BchDepositParams): Promise<string> {
    // deposit token
    try {
      const memo =
        poolType === 'SYM' && thorchainAddress
          ? this._buildDepositMemo(asset, thorchainAddress)
          : this._buildDepositMemo(asset);

      // TODO -> consolidate this with BTC, BCH, LTC
      const balanceAmount = this.userService.findRawBalance(balances, asset);
      const toBase = assetToBase(assetAmount(inputAmount));
      const feeToBase = assetToBase(assetAmount(estimatedFee));
      const amount = balanceAmount
        // subtract fee
        .minus(feeToBase.amount())
        // subtract amount
        .minus(toBase.amount())
        .isGreaterThan(0)
        ? toBase.amount() // send full amount, fee can be deducted from remaining balance
        : toBase.amount().minus(feeToBase.amount()); // after deductions, not enough to process, subtract fee from amount

      if (amount.isLessThan(0)) {
        throw new Error('Insufficient funds. Try sending a smaller amount');
      }
      // TODO -> consolidate this with BTC, BCH, LTC

      const hash = await client.transfer({
        asset: {
          chain: asset.chain,
          symbol: asset.symbol,
          ticker: asset.ticker,
        },
        amount: baseAmount(amount),
        recipient: recipientPool.address,
        memo,
        feeRate: +recipientPool.gas_rate,
      });

      return hash;
    } catch (error) {
      throw error;
    }
  }

  async runeDeposit({
    client,
    inputAmount,
    memo,
  }: RuneDepositParams): Promise<string> {
    return await client.deposit({
      amount: assetToBase(assetAmount(inputAmount)),
      memo,
    });
  }

  private _buildDepositMemo(asset: Asset, symDepositAddress?: string) {
    return symDepositAddress
      ? `+:${asset.chain}.${asset.symbol}:${symDepositAddress}`
      : `+:${asset.chain}.${asset.symbol}`;
  }
}
