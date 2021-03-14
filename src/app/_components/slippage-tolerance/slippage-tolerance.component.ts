import { Component, OnDestroy, OnInit, EventEmitter, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { SlippageToleranceService } from 'src/app/_services/slippage-tolerance.service';

@Component({
  selector: 'app-slippage-tolerance',
  templateUrl: './slippage-tolerance.component.html',
  styleUrls: ['./slippage-tolerance.component.scss']
})
export class SlippageToleranceComponent implements OnInit, OnDestroy {

  @Output() close: EventEmitter<null> = new EventEmitter<null>();

  slippageTolerance$: Subscription;
  tolerance: number;

  set customTolerance(num: number) {
    this._customTolerance = num;
    const tolerance = (num) ? num : 3;
  }
  get customTolerance() {
    return this._customTolerance;
  }
  private _customTolerance: number;

  constructor(private slippageToleranceService: SlippageToleranceService) {
    this.slippageTolerance$ = this.slippageToleranceService.slippageTolerance$.subscribe(
      (percent: number) => {
        this.tolerance = percent;
        this.customTolerance = percent;
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

  setSlippage() {
    this.slippageToleranceService.setSlippageTolerance(this.customTolerance);
    this.close.emit();
  }

  ngOnDestroy() {
    this.slippageTolerance$.unsubscribe();
  }

}
