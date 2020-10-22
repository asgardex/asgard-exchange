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


    // https://api.blockchair.com/bitcoin/testnet/dashboards/address/tb1qzqtnjeghzjdvr6sz30qn5l52lwgjwmq7clpsc5?key=A___QJPUZs1cbpbK2wkKeiQoixbFnxwg

    const chain = environment.network === 'testnet' ? 'bitcoin/testnet' : 'bitcoin';
    const params = new HttpParams().set('key', 'A___QJPUZs1cbpbK2wkKeiQoixbFnxwg');

    return this.http.get<BlockchairBtcTransactionDTO>(`https://api.blockchair.com/${chain}/dashboards/transaction/${hash}`, { params });
  }

}
