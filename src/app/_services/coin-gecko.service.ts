import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export interface CurrencyConversionDTO {
  [coin: string]: {
    usd: number;
  };
}

export interface CGCoinListItem {
  id: string;
  symbol: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CoinGeckoService {

  private coinList$: Observable<CGCoinListItem[]>;

  constructor(private http: HttpClient) { }

  getCoinList(): Observable<CGCoinListItem[]> {
    if (!this.coinList$) {
      this.coinList$ = this.http.get<CGCoinListItem[]>('https://api.coingecko.com/api/v3/coins/list').pipe(shareReplay(1));
    }
    return this.coinList$;
  }

  getCurrencyConversion(id: string): Observable<CurrencyConversionDTO> {
    return this.http.get<CurrencyConversionDTO>(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
  }

  getCoinIdBySymbol(ticker: string, list: CGCoinListItem[]): string {

    const match = list.find( (item) => item.symbol === ticker.toLowerCase() );
    return match?.id ?? null;

  }

}
