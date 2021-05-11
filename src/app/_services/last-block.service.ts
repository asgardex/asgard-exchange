import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LastBlockService {
  private lastBlockSource = new BehaviorSubject<number>(null);
  lastBlock$ = this.lastBlockSource.asObservable();

  constructor() {}

  setBlock(block: number) {
    this.lastBlockSource.next(block);
  }
}
