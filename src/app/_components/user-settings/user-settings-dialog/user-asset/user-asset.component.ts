import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { CoinGeckoService } from 'src/app/_services/coin-gecko.service';
import { CopyService } from 'src/app/_services/copy.service';

@Component({
  selector: 'app-user-asset',
  templateUrl: './user-asset.component.html',
  styleUrls: ['./user-asset.component.scss']
})
export class UserAssetComponent implements OnInit {

  @Input() asset: AssetAndBalance;
  @Input() address: string;
  @Output() back: EventEmitter<null>;
  @Output() send: EventEmitter<null>;
  @Output() upgradeRune: EventEmitter<null>;
  @Output() deposit: EventEmitter<null>;

  usdValue: number;

  constructor(private cgService: CoinGeckoService, private copyService: CopyService) {
    this.back = new EventEmitter();
    this.send = new EventEmitter();
    this.upgradeRune = new EventEmitter();
    this.deposit = new EventEmitter();
  }

  ngOnInit(): void {

    this.getCoinGeckoCoinList();

  }

  getCoinGeckoCoinList() {

    if (this.asset && this.asset.asset) {
      this.cgService.getCoinList().subscribe( (res) => {
        const id = this.cgService.getCoinIdBySymbol(this.asset.asset.ticker, res);
        this.getUsdPrice(id);
      });
    }

  }

  getUsdPrice(id: string) {

    if (this.asset) {
      this.cgService.getCurrencyConversion(id).subscribe(
        (res) => {
          for (const [key, value] of Object.entries(res)) {
            this.usdValue = this.asset.balance.amount().multipliedBy(value.usd).toNumber();
          }
        }
      );
    }

  }

  copyToClipboard() {
    if (this.address) {
      this.copyService.copyToClipboard(this.address);
    }
  }

}
