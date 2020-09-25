import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, timer, of, Subscription } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { LastBlock } from 'src/app/_classes/last-block';
import { LastBlockService } from 'src/app/_services/last-block.service';
import { MidgardService } from 'src/app/_services/midgard.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  killPolling: Subject<void> = new Subject();
  subs: Subscription[];

  constructor(private midgardService: MidgardService, private lastBlockService: LastBlockService) {
    this.subs = [];
  }

  ngOnInit(): void {
    this.pollLastBlock();
  }

  pollLastBlock(): void {
    const refreshInterval$ = timer(0, 15000)
    .pipe(
      // This kills the request if the user closes the component
      takeUntil(this.killPolling),
      // switchMap cancels the last request, if no response have been received since last tick
      switchMap(() => this.midgardService.getLastBlock()),
      // catchError handles http throws
      catchError(error => of(error))
    ).subscribe( async (res: LastBlock) => {

      this.lastBlockService.setBlock(res.thorchain);

    });
    this.subs.push(refreshInterval$);
  }

  ngOnDestroy(): void {

  }

}
