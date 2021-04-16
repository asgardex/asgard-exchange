import { Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { MidgardService } from './midgard.service';

@Injectable({
  providedIn: 'root'
})
export class NetworkQueueService {

  // networkQueue$: Observable<Ne>

  constructor(private midgardService: MidgardService) {

  //   this.allCurrencies$ = timer(1, 3000).pipe(
  //     switchMap(() => http.get<CurrencyInfo[]>('http://localhost:8000/currencyInfo')),
  //     retry(),
  //     share(),
  //     takeUntil(this.stopPolling)
  //  );

  }
}
