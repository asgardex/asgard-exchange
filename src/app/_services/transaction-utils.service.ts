import { Injectable } from '@angular/core';
import { bn } from '@xchainjs/xchain-util';
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

  calculateNetworkFee(asset: Asset, inboundAddresses: PoolAddressDTO[], assetPool?: PoolDTO): number {

    const matchingInboundAddress = inboundAddresses.find( (pool) => pool.chain === asset.chain );

    if (matchingInboundAddress) {
      switch (asset.chain) {
        case 'BTC':
        case 'LTC':
        case 'BCH':
          return (250 * (+matchingInboundAddress.gas_rate) * 3) / (10 ** 8);

        case 'ETH':

          // ETH
          if (asset.symbol === 'ETH') {
            return (35000 * (+matchingInboundAddress.gas_rate) * (10 ** 9) * 3)  / (10 ** 18);
          }
          // ERC20
          else {
            const ethGasVal = (70000 * (+matchingInboundAddress.gas_rate) * (10 ** 9) * 3)  / (10 ** 18);
            const tokenEthValue = (+assetPool.assetPriceUSD) / (+this._ethPool.assetPriceUSD);
            return ethGasVal * tokenEthValue;
          }

        case 'BNB':
          return 0.000375;
      }

    } else if (asset.chain === 'THOR') {
      return this._outboundTransactionFee ?? 0.2;
    } else {
      console.error('calculateNetworkFee no chain match');
    }

  }

}
