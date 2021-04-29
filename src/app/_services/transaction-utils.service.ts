import { Injectable } from '@angular/core';
import { assetToString, bn } from '@xchainjs/xchain-util';
import { Asset } from '../_classes/asset';
import { PoolDTO } from '../_classes/pool';
import { PoolAddressDTO } from '../_classes/pool-address';
import { MidgardService } from './midgard.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionUtilsService {

  private _outboundTransactionFee: number;
  private _ethPool: PoolDTO;

  constructor(private midgardService: MidgardService) {
    this._getOutboundTxFee();
    this._getPools();
  }

  _getOutboundTxFee() {
    this.midgardService.getConstants().subscribe(
      (res) => {
        this._outboundTransactionFee = bn(res.int_64_values.OutboundTransactionFee).div(10 ** 8).toNumber();
      },
      (err) => console.error('error fetching constants: ', err)
    );
  }

  _getPools() {
    this.midgardService.getPools().subscribe(
      (pools) => {
        const ethPool = pools.find( (pool) => pool.asset === 'ETH.ETH' );
        if (ethPool) {
          this._ethPool = ethPool;
        }
      }
    );
  }

  /**
   * reference https://github.com/thorchain/asgardex-electron/issues/1381
   */
  calculateNetworkFee(asset: Asset, inboundAddresses: PoolAddressDTO[], direction: 'INBOUND' | 'OUTBOUND', assetPool?: PoolDTO): number {

    const multiplier = (direction === 'OUTBOUND') ? 3 : 1;
    const matchingInboundAddress = inboundAddresses.find( (pool) => pool.chain === asset.chain );

    if (matchingInboundAddress) {
      switch (asset.chain) {
        case 'BTC':
        case 'LTC':
        case 'BCH':
          return (250 * (+matchingInboundAddress.gas_rate) * multiplier) / (10 ** 8);

        case 'ETH':

          // ETH
          if (asset.symbol === 'ETH') {
            return (35000 * (+matchingInboundAddress.gas_rate) * (10 ** 9) * multiplier)  / (10 ** 18);
          }
          // ERC20
          else {
            const ethGasVal = (70000 * (+matchingInboundAddress.gas_rate) * (10 ** 9) * multiplier)  / (10 ** 18);
            const tokenEthValue = (+this._ethPool.assetPriceUSD) / (+assetPool.assetPriceUSD);
            return ethGasVal * tokenEthValue;
          }

        case 'BNB':
          return (multiplier * (+matchingInboundAddress.gas_rate) * 1) / (10 ** 8);
      }

    } else if (asset.chain === 'THOR') {
      return this._outboundTransactionFee ?? 0.2;
    } else {
      console.error('calculateNetworkFee no chain match');
    }

  }

}
