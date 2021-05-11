import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { CopyService } from 'src/app/_services/copy.service';

@Component({
  selector: 'app-user-asset',
  templateUrl: './user-asset.component.html',
  styleUrls: ['./user-asset.component.scss'],
})
export class UserAssetComponent {
  @Input() set asset(asset: AssetAndBalance) {
    this._asset = asset;
    this.usdValue = this.asset.balance
      .amount()
      .multipliedBy(this.asset.assetPriceUSD)
      .toNumber();
  }
  get asset() {
    return this._asset;
  }
  _asset: AssetAndBalance;
  @Input() address: string;
  @Output() back: EventEmitter<null>;
  @Output() send: EventEmitter<null>;
  @Output() upgradeRune: EventEmitter<null>;
  @Output() deposit: EventEmitter<null>;

  usdValue: number;

  constructor(private copyService: CopyService) {
    this.back = new EventEmitter();
    this.send = new EventEmitter();
    this.upgradeRune = new EventEmitter();
    this.deposit = new EventEmitter();
  }

  copyToClipboard() {
    if (this.address) {
      this.copyService.copyToClipboard(this.address);
    }
  }
}
