import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { baseToAsset } from '@thorchain/asgardex-util';
import { Balances } from '@xchainjs/xchain-client';
import { Subscription } from 'rxjs';
import { Asset } from 'src/app/_classes/asset';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { User } from 'src/app/_classes/user';
import { AvailableChain } from 'src/app/_const/available-chain';
import { CopyService } from 'src/app/_services/copy.service';
import { UserService } from 'src/app/_services/user.service';

@Component({
  selector: 'app-user-address',
  templateUrl: './user-address.component.html',
  styleUrls: ['./user-address.component.scss']
})
export class UserAddressComponent implements OnInit {

  @Input() address: string;
  @Input() chain: AvailableChain;
  @Output() back: EventEmitter<null>;
  @Output() navigateToAsset: EventEmitter<AssetAndBalance>;
  iconPath: string;
  user: User;
  balances: Balances;
  subs: Subscription[];
  assets: AssetAndBalance[];
  loading: boolean;

  constructor(private userService: UserService, private copyService: CopyService) {
    this.back = new EventEmitter<null>();
    this.navigateToAsset = new EventEmitter<AssetAndBalance>();
    this.loading = true;
  }

  ngOnInit(): void {

    this.iconPath = this.getIconPath(this.chain);

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {

        if (balances) {

          this.balances = balances.filter( (balance) => balance.asset.chain === this.chain );
          this.assets = this.balances.reduce( (list, balance) => {

            const asset = new Asset(`${balance.asset.chain}.${balance.asset.symbol}`);
            const assetBalance = {
              asset,
              balance: baseToAsset(balance.amount)
            };
            list.push(assetBalance);
            return list;

          }, []);

          this.loading = false;

        }
      }
    );

    this.subs = [balances$];


  }

  getIconPath(chain: AvailableChain): string {
    switch (chain) {
      case 'BNB':
        return 'assets/images/token-icons/bnb.png';

      case 'BTC':
        return 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/BTCB-1DE/logo.png';

      case 'THOR':
        return 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/assets/RUNE-B1A/logo.png';
    }
  }

  copyToClipboard(address: string) {
    this.copyService.copyToClipboard(address);
  }

  selectAsset(asset: Asset) {
    const match = this.assets.find( (assetAndBalance) => assetAndBalance.asset === asset );
    if (match) {
      this.navigateToAsset.next(match);
    } else {
      console.error('no match found for asset: ', asset);
    }
  }

}
