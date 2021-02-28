import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type SochainTxResponse = {
  status: string,
  data: {
    txid: string,
    blockhash: string,
    confirmations: number,
    time: number,
    // inputs: [ ... ],
    // outputs: [ ... ],
    tx_hex: string,
    size: number,
    version: number,
    locktime: number
  }
};

@Injectable({
  providedIn: 'root'
})
export class SochainService {

  constructor(private http: HttpClient) { }

  getTransaction({txID, network}: {txID: string, network: string}): Observable<SochainTxResponse> {

    const sochainNetwork = network === 'testnet' ? 'BTCTEST' : 'BTC';

    return this.http.get<SochainTxResponse>(`https://sochain.com/api/v2/get_tx/${sochainNetwork}/${txID}`);
  }

}
