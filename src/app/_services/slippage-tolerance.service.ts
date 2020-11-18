import { Injectable } from '@angular/core';
import { assetAmount, assetToBase } from '@thorchain/asgardex-util';
import BigNumber from 'bignumber.js';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SlippageToleranceService {

  private slippageToleranceSource = new BehaviorSubject<number>(0.5);
  slippageTolerance$ = this.slippageToleranceSource.asObservable();
  private _slippageTolerance: number;

  constructor() {
    this._slippageTolerance = 0.5;
  }

  setSlippageTolerance(percent: number) {
    const tolerance = percent > 30 ? 30 : percent;
    this._slippageTolerance = tolerance;
    this.slippageToleranceSource.next(tolerance);
  }

  getSlipLimitFromAmount(amount: number): BigNumber {
    const baseTransferAmount = assetToBase(assetAmount(amount));
    return baseTransferAmount.amount().multipliedBy( (100 - this._slippageTolerance) / 100);
  }

}
