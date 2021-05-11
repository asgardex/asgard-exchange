import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface RpcTxSearchRes {
  result: {
    total_count: string;
    txs: {
      hash: string;
      height: string;
    }[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class ThorchainRpcService {
  private _basePath: string;

  constructor(private http: HttpClient) {
    this._basePath =
      environment.network === 'testnet'
        ? 'https://testnet.rpc.thorchain.info'
        : 'https://rpc.thorchain.info';
  }

  txSearch(sender: string): Observable<RpcTxSearchRes> {
    const params = new HttpParams()
      .set('query', `"transfer.sender='${sender}'"`)
      .set('per_page', '"100"')
      .set('order_by', '"desc"');
    return this.http.get<RpcTxSearchRes>(`${this._basePath}/tx_search`, {
      params,
    });
  }
}
