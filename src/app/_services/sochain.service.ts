import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Chain } from '@xchainjs/xchain-util';

export type SochainTxResponse = {
  status: string;
  data: {
    txid: string;
    blockhash: string;
    confirmations: number;
    time: number;
    // inputs: [ ... ],
    // outputs: [ ... ],
    tx_hex: string;
    size: number;
    version: number;
    locktime: number;
  };
};

@Injectable({
  providedIn: 'root',
})
export class SochainService {
  constructor(private http: HttpClient) {}

  getTransaction({
    txID,
    network,
    chain,
  }: {
    txID: string;
    network: string;
    chain: Chain;
  }): Observable<SochainTxResponse> {
    let sochainNetwork: string;

    if (chain === 'LTC') {
      sochainNetwork = network === 'testnet' ? 'LTCTEST' : 'LTC';
    } else if (chain === 'BTC') {
      sochainNetwork = network === 'testnet' ? 'BTCTEST' : 'BTC';
    } else {
      console.error('no chains match');
      return;
    }

    return this.http.get<SochainTxResponse>(
      `https://sochain.com/api/v2/get_tx/${sochainNetwork}/${txID}`
    );
  }
}
