import { Injectable } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { retry, share, switchMap } from 'rxjs/operators';
import { MidgardService, ThorchainQueue } from './midgard.service';

@Injectable({
  providedIn: 'root',
})
export class NetworkQueueService {
  networkQueue$: Observable<ThorchainQueue>;

  constructor(private midgardService: MidgardService) {
    this.networkQueue$ = timer(0, 60000).pipe(
      switchMap(() => this.midgardService.getQueue()),
      retry(),
      share()
    );
  }
}
