import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SlippageToleranceService } from 'src/app/_services/slippage-tolerance.service';

@Component({
  selector: 'app-slippage-tolerance',
  templateUrl: './slippage-tolerance.component.html',
  styleUrls: ['./slippage-tolerance.component.scss']
})
export class SlippageToleranceComponent implements OnInit, OnDestroy {

  slippageTolerance$: Subscription;
  tolerance: number;

  set customTolerance(num: number) {
    this._customTolerance = num;
    const tolerance = (num) ? num : 0.5;
    this.setSlippageTolerance(tolerance);

  }
  get customTolerance() {
    return this._customTolerance;
  }
  private _customTolerance: number;

  constructor(private slippageToleranceService: SlippageToleranceService) {
    this.slippageTolerance$ = this.slippageToleranceService.slippageTolerance$.subscribe(
      (percent: number) => {
        this.tolerance = percent;
        if (!this.customTolerance && percent !== 0.1 && percent !== 0.5 && percent !== 1.0) {
          this.customTolerance = percent;
        }
      }
    );
  }

  ngOnInit(): void {
  }

  selectSlippage(num: number) {
    this.customTolerance = null;
    this.setSlippageTolerance(num);
  }

  setSlippageTolerance(num: number) {
    this.slippageToleranceService.setSlippageTolerance(num);
  }

  ngOnDestroy() {
    this.slippageTolerance$.unsubscribe();
  }

}
