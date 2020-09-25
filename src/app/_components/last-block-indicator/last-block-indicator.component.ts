import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LastBlockService } from 'src/app/_services/last-block.service';

@Component({
  selector: 'app-last-block-indicator',
  templateUrl: './last-block-indicator.component.html',
  styleUrls: ['./last-block-indicator.component.scss']
})
export class LastBlockIndicatorComponent implements OnInit, OnDestroy {

  subs: Subscription[];
  lastBlock: number;
  updating: boolean;

  constructor(private lastBlockService: LastBlockService) {

    const lastBlock$ = this.lastBlockService.lastBlock$.subscribe(
      (block) => {
        this.lastBlock = block;
        this.updating = true;
        setTimeout( () => {
          this.updating = false;
        }, 1000);
      }
    );

    this.subs = [lastBlock$];
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    for (const subs of this.subs) {
      subs.unsubscribe();
    }
  }

}
