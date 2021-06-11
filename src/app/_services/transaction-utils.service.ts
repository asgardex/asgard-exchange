import { Injectable } from '@angular/core';
import { ETH_DECIMAL } from '@xchainjs/xchain-ethereum';
import { BaseAmount, baseAmount, bn, Chain } from '@xchainjs/xchain-util';
import { ethers } from 'ethers';
import { Asset } from '../_classes/asset';
import { PoolDTO } from '../_classes/pool';
import { PoolAddressDTO } from '../_classes/pool-address';
import { MidgardService } from './midgard.service';
import { TxType } from '../_const/tx-type';

@Injectable({
  providedIn: 'root',
})
export class TransactionUtilsService {
  private _outboundTransactionFee: number;
  private _ethPool: PoolDTO;

  constructor(private midgardService: MidgardService) {
    this._getOutboundTxFee();
    this._getPools();
  }

  private _getOutboundTxFee() {
    this.midgardService.getConstants().subscribe(
      (res) => {
        this._outboundTransactionFee = bn(
          res.int_64_values.OutboundTransactionFee
        )
          .div(10 ** 8)
          .toNumber();
      },
      (err) => console.error('error fetching constants: ', err)
    );
  }

  private _getPools() {
    this.midgardService.getPools().subscribe((pools) => {
      const ethPool = pools.find((pool) => pool.asset === 'ETH.ETH');
      if (ethPool) {
        this._ethPool = ethPool;
      }
    });
  }

  /**
   * reference https://github.com/thorchain/asgardex-electron/issues/1381
   */
  calculateNetworkFee(
    asset: Asset,
    inboundAddresses: PoolAddressDTO[],
    direction: TxType,
    assetPool?: PoolDTO
  ): number {
    const multiplier = direction === 'OUTBOUND' ? 3 : 1;
    const matchingInboundAddress = inboundAddresses.find(
      (pool) => pool.chain === asset.chain
    );

    if (matchingInboundAddress) {
      switch (asset.chain) {
        case 'BTC':
        case 'LTC':
        case 'BCH':
          // prettier-ignore
          return (250 * (+matchingInboundAddress.gas_rate) * multiplier) / (10 ** 8);

        case 'ETH':
          // ETH
          if (asset.symbol === 'ETH') {
            const limit = direction === 'EXTERNAL' ? 21000 : 37000;

            // prettier-ignore
            return (limit * (+matchingInboundAddress.gas_rate * 10 ** 9) * multiplier) / (10 ** 18);
          }
          // ERC20
          else {
            if (this._ethPool) {
              // prettier-ignore
              const ethGasVal = (70000 * (+matchingInboundAddress.gas_rate) * (10 ** 9) * multiplier)  / (10 ** 18);
              const tokenEthValue =
                +this._ethPool.assetPriceUSD / +assetPool.assetPriceUSD;
              return ethGasVal * tokenEthValue;
            } else {
              console.error('no eth pool found');
            }
          }

        case 'BNB':
          // prettier-ignore
          return (multiplier * (+matchingInboundAddress.gas_rate) * 1) / (10 ** 8);
      }
    } else if (asset.chain === 'THOR') {
      return this._outboundTransactionFee ?? 0.2;
    } else {
      console.error('calculateNetworkFee no chain match');
    }
  }

  getMinAmountByChain(chain: Chain): BaseAmount {
    if (chain === 'BNB') {
      return baseAmount(1);
    }
    // 1000 satoshi
    if (chain === 'BTC') {
      return baseAmount(10001);
    }
    // 1 Thor
    if (chain === 'THOR') {
      return baseAmount(1);
    }
    // 0 ETH
    if (chain === 'ETH') {
      // this isn't working for withdraws
      // return baseAmount(0);

      // need to send 0.00000001 ETH as temporary workaround
      return baseAmount(
        ethers.utils.parseUnits('10', 'gwei').toString(),
        ETH_DECIMAL
      );
    }
    // 1000 satoshi
    if (chain === 'LTC') {
      return baseAmount(10001);
    }
    // 1000 satoshi
    if (chain === 'BCH') {
      return baseAmount(10001);
    }

    return baseAmount(1);
  }
}
