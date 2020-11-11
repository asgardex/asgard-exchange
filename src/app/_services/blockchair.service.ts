import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';


export interface BlockchairBtcTransactionDTO {
  data: {
    [key: string]: {
      transaction: {
        block_id: number;
      }
    }
  };
}

@Injectable({
  providedIn: 'root'
})
export class BlockchairService {

  constructor(private http: HttpClient) { }

  getBitcoinTransaction(hash: string): Observable<BlockchairBtcTransactionDTO> {

    const chain = environment.network === 'testnet' ? 'bitcoin/testnet' : 'bitcoin';
    const params = new HttpParams().set('key', environment.blockchairKey);

    return this.http.get<BlockchairBtcTransactionDTO>(`https://api.blockchair.com/${chain}/dashboards/transaction/${hash}`, { params });
  }

}
