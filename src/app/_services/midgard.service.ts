import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PoolDetail } from '../_classes/pool-detail';
import { MidgardAsset } from '../_classes/midgard-asset';
import { MidgardConstants } from '../_classes/midgard-constants';
import { PoolAddressesDTO } from '../_classes/pool-address';
import { TransactionDTO } from '../_classes/transaction';

@Injectable({
  providedIn: 'root'
})
export class MidgardService {

  private basePath: string;

  constructor(private http: HttpClient) {
    this.basePath = (environment.network === 'testnet')
      ? 'https://midgard.bepswap.com/v1'
      // ? 'http://168.119.21.60:8080/v1'
      : 'https://chaosnet-midgard.bepswap.com/v1';
  }

  getPools(): Observable<string[]> {
    return this.http.get<string[]>(`${this.basePath}/pools`);
  }

  getPoolDetails(commaSeparatedAssets: string): Observable<PoolDetail[]> {

    const params = new HttpParams().set('asset', commaSeparatedAssets);

    return this.http.get<PoolDetail[]>(`${this.basePath}/pools/detail`, {params});
  }

  getAssets(assetsString?: string): Observable<MidgardAsset[]> {

    let params = new HttpParams();

    if (assetsString) {
      params = params.set('asset', assetsString);
    }

    return this.http.get<MidgardAsset[]>(`${this.basePath}/assets`, {params});

  }

  getConstants(): Observable<MidgardConstants> {
    return this.http.get<MidgardConstants>(`${this.basePath}/thorchain/constants`);
  }

  getProxiedPoolAddresses(): Observable<PoolAddressesDTO> {
    return this.http.get<PoolAddressesDTO>(`${this.basePath}/thorchain/pool_addresses`);
  }

  getTransaction(txId: string): Observable<TransactionDTO> {

    const params = new HttpParams().set('offset', '0').set('limit', '1').set('txid', txId);

    return this.http.get<TransactionDTO>(`${this.basePath}/txs`, {params});
  }

}
