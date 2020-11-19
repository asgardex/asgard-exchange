import { Injectable } from '@angular/core';
import { assetAmount, assetToBase } from '@thorchain/asgardex-util';
import BigNumber from 'bignumber.js';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SlippageToleranceService {

  private slippageToleranceSource = new BehaviorSubject<number>(3);
  slippageTolerance$ = this.slippageToleranceSource.asObservable();
  private _slippageTolerance: number;

  constructor() {
    this._slippageTolerance = 3;
  }

  setSlippageTolerance(percent: number) {
    this._slippageTolerance = percent;
    this.slippageToleranceSource.next(percent);
  }

  getSlipLimitFromAmount(amount: number): BigNumber {
    const baseTransferAmount = assetToBase(assetAmount(amount));
    return baseTransferAmount.amount().multipliedBy( (100 - this._slippageTolerance) / 100);
  }

}
