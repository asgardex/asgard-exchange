import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MidgardConstants } from '../_classes/midgard-constants';
import { PoolAddressDTO } from '../_classes/pool-address';
import { TransactionDTO } from '../_classes/transaction';
import { LastBlock } from '../_classes/last-block';
import { PoolDTO } from '../_classes/pool';
import { MemberDTO } from '../_classes/member';

@Injectable({
  providedIn: 'root'
})
export class MidgardService {

  private v2BasePath: string;

  constructor(private http: HttpClient) {
    this.v2BasePath = 'https://testnet.midgard.thorchain.info/v2';
  }
  /**
   * V2 Endpoints
   *
   */

  getConstants(): Observable<MidgardConstants> {
    return this.http.get<MidgardConstants>(`${this.v2BasePath}/thorchain/constants`);
  }

  getLastBlock(): Observable<LastBlock[]> {
    return this.http.get<LastBlock[]>(`${this.v2BasePath}/thorchain/lastblock`);
  }


  getInboundAddresses(): Observable<PoolAddressDTO[]> {
    return this.http.get<PoolAddressDTO[]>(`${this.v2BasePath}/thorchain/inbound_addresses`);
  }

  getPools(): Observable<PoolDTO[]> {
    return this.http.get<PoolDTO[]>(`${this.v2BasePath}/pools`);
  }

  getPool(asset: string): Observable<PoolDTO> {
    return this.http.get<PoolDTO>(`${this.v2BasePath}/pool/${asset}`);
  }

  getMember(address: string): Observable<MemberDTO> {
    return this.http.get<MemberDTO>(`${this.v2BasePath}/member/${address}`);
  }

  getTransaction(txId: string): Observable<TransactionDTO> {

    const params = new HttpParams().set('offset', '0').set('limit', '1').set('txid', txId);

    return this.http.get<TransactionDTO>(`${this.v2BasePath}/actions`, {params});
  }

}
