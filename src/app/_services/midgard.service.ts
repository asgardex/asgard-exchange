import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PoolDetail } from '../_classes/pool-detail';
import { Asset } from '../_classes/asset';
import { MidgardConstants } from '../_classes/midgard-constants';

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

  getAssets(assetsString?: string): Observable<Asset[]> {

    let params = new HttpParams();

    if (assetsString) {
      params = params.set('asset', assetsString);
    }

    return this.http.get<Asset[]>(`${this.basePath}/assets`, {params});

  }

  getConstants(): Observable<MidgardConstants> {
    return this.http.get<MidgardConstants>(`${this.basePath}/thorchain/constants`);
  }

}
