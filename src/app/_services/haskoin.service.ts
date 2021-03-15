import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type HaskoinTxResponse = {
  // lots of other stuff from https://api.haskoin.com/#/Transaction/getRawTransaction
  txid: string;
  block: {
    mempool?: number;
    height?: number;
  }
};

@Injectable({
  providedIn: 'root'
})
export class HaskoinService {

  constructor(private http: HttpClient) { }

  getTx(hash: string): Observable<HaskoinTxResponse> {
    const url = environment.network === 'testnet'
      ? 'https://api.haskoin.com/bchtest'
      : 'https://api.haskoin.com/bch';

    return this.http.get<HaskoinTxResponse>(`${url}/transaction/${hash}`);

  }
}
