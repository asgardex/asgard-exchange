import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { CGCoinListItem } from 'src/app/_services/coin-gecko.service';
import { ActionOptions } from '../action-options.enum';

@Component({
  selector: 'app-deposit-form',
  templateUrl: './deposit-form.component.html',
  styleUrls: ['./deposit-form.component.scss'],
})
export class DepositFormComponent {
  @Input() asset: AssetAndBalance;
  @Output() confirm: EventEmitter<null>;

  @Input() action: ActionOptions;
  @Output() actionChange = new EventEmitter<ActionOptions>();

  @Input() memoAsset: string;
  @Output() memoAssetChange = new EventEmitter<string>();

  @Input() destinationAddress: string;
  @Output() destinationAddressChange = new EventEmitter<string>();

  @Input() swapLimit: string;
  @Output() swapLimitChange = new EventEmitter<string>();

  @Output() depositAmountChange = new EventEmitter<number>();
  @Input() get depositAmount() {
    return this._depositAmount;
  }
  set depositAmount(amount: number) {
    if (amount !== this.depositAmount) {
      this.depositAmountChange.next(amount);
      this._depositAmount = amount;
    }
  }
  _depositAmount: number;

  @Output() withdrawAmountChange = new EventEmitter<number>();
  @Input() get withdrawAmount() {
    return this._withdrawAmount;
  }
  set withdrawAmount(amount: number) {
    if (amount !== this.withdrawAmount) {
      this._withdrawAmount = amount;
      this.withdrawAmountChange.next(amount);

      if (this.action === 'WITHDRAW') {
        this.updateMemo(2, String(amount));
      }
    }
  }
  _withdrawAmount: number;

  @Input() memo: string;
  @Output() memoChange = new EventEmitter<string>();

  @Input() memoAmount: number;
  @Output() memoAmountChange = new EventEmitter<number>();

  @Output() back = new EventEmitter<null>();

  coinGeckoList: CGCoinListItem[];

  constructor() {
    this.confirm = new EventEmitter();
  }

  onMemoAssetChange(memoAsset: string) {
    this.memoAssetChange.next(memoAsset);
    this.updateMemo(1, memoAsset);
  }

  updateDestinationAddress(address: string) {
    this.destinationAddressChange.next(address);

    let position;
    switch (this.action) {
      case ActionOptions.SWAP:
      case ActionOptions.ADD:
        position = 2;
        break;

      case ActionOptions.BOND:
      case ActionOptions.UNBOND:
      case ActionOptions.LEAVE:
        position = 1;
        break;
    }

    this.updateMemo(position, address);
  }

  updateAction(action: ActionOptions) {
    this.destinationAddressChange.next('');
    this.memoAssetChange.next('');
    this.actionChange.next(action);
    this.memoChange.next(action);

    if (action === 'WITHDRAW' || action === 'LEAVE' || action === 'UNBOND') {
      /**
       * this should be 0, will be updated on thorchain bugfix in 0.24.0
       */
      const smallestUnit = 1;
      this.depositAmountChange.next(smallestUnit);
      this.depositAmount = smallestUnit;
    } else {
      this.depositAmountChange.next(null);
      this.depositAmount = null;
    }
  }

  updateSwapLimit(limit: string): void {
    this.swapLimitChange.next(limit);
    this.updateMemo(3, limit);
  }

  updateUnbondAmount(amount: number): void {
    this.memoAmountChange.next(amount);
    this.updateMemo(2, String(amount));
  }

  updateMemo(position: number, val: string): void {
    const splitMemo = this.memo.split(':');
    let memo = '';

    if (+position > splitMemo.length) {
      for (let i = 0; i <= position; i++) {
        if (splitMemo[i]) {
          memo += `${splitMemo[i]}:`;
        } else {
          if (i !== position) {
            memo += ':';
          }
        }

        if (i === position) {
          memo += val;
        }
      }
    } else if (+position === splitMemo.length) {
      memo = `${this.memo}:${val}`;
    } else {
      memo = splitMemo.reduce((updatedMemo, segment, index) => {
        if (index === +position) {
          updatedMemo += val;
        } else {
          updatedMemo += segment;
        }

        if (index < splitMemo.length - 1) {
          updatedMemo += ':';
        }

        return updatedMemo;
      }, '');
    }

    if (memo.charAt(memo.length - 1) === ':') {
      memo = memo.slice(0, -1);
    }

    this.memoChange.next(memo);
  }

  confirmSend() {
    this.confirm.next();
  }
}
