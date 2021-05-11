import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SlippageToleranceService } from 'src/app/_services/slippage-tolerance.service';

@Component({
  selector: 'app-slippage-tolerance',
  templateUrl: './slippage-tolerance.component.html',
  styleUrls: ['./slippage-tolerance.component.scss'],
})
export class SlippageToleranceComponent implements OnDestroy {
  slippageTolerance$: Subscription;
  tolerance: number;

  set customTolerance(num: number) {
    this._customTolerance = num;
    const tolerance = num ? num : 3;
    this.setSlippageTolerance(tolerance);
  }
  get customTolerance() {
    return this._customTolerance;
  }
  private _customTolerance: number;

  constructor(private slippageToleranceService: SlippageToleranceService) {
    this.slippageTolerance$ =
      this.slippageToleranceService.slippageTolerance$.subscribe(
        (percent: number) => {
          this.tolerance = percent;
          if (
            !this.customTolerance &&
            percent !== 3 &&
            percent !== 5 &&
            percent !== 10
          ) {
            this.customTolerance = percent;
          }
        }
      );
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
