import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { ActionOptions } from './action-options.enum';

@Component({
  selector: 'app-deposit',
  templateUrl: './deposit.component.html',
  styleUrls: ['./deposit.component.scss']
})
export class DepositComponent implements OnInit {

  @Output() back: EventEmitter<null>;
  @Input() asset: AssetAndBalance;

  depositState: 'FORM' | 'CONFIRM' | 'TX_SUBMITTED';
  action: ActionOptions;
  memoAsset: string;
  destinationAddress: string;
  swapLimit: string;
  depositAmount: number;
  memo: string;
  withdrawAmount: number; // percentage associated with WITHDRAW
  memoAmount: number; // this is used for UNBOND

  constructor() {
    this.back = new EventEmitter();
    this.depositState = 'FORM';
    this.memo = ActionOptions.ADD;
    this.action = ActionOptions.ADD;
    this.memoAsset = '';
    this.destinationAddress = '';
    this.withdrawAmount = 0;
    this.memoAmount = 0;
  }

  ngOnInit(): void {

  }

  confirm() {
    this.depositState = 'CONFIRM';
  }

  onBack() {
    if (this.depositState === 'FORM') {
      this.back.next();
    } else {
      this.depositState = 'FORM';
    }

  }

}
