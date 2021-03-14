import { Component, Inject, OnInit } from '@angular/core';
import { Asset } from 'src/app/_classes/asset';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { MainViewsEnum, OverlaysService } from 'src/app/_services/overlays.service';
import { UserService } from 'src/app/_services/user.service';

@Component({
  selector: 'app-native-rune-prompt-modal',
  templateUrl: './native-rune-prompt-modal.component.html',
  styleUrls: ['./native-rune-prompt-modal.component.scss']
})
export class NativeRunePromptModalComponent implements OnInit {

  assets: AssetAndBalance[];
  loading = false;
  mode: 'SELECT_ASSET' | 'UPGRADE_ASSET' | 'CONFIRM' | 'SUCCESS';
  selectedAsset: AssetAndBalance;
  amountToSend: number;
  successfulTxHash: string;
  nonNativeRuneAssets: AssetAndBalance[];

  constructor(
    private userService: UserService,
    private overlaysService: OverlaysService
  ) {
    this.nonNativeRuneAssets = [];

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {

        if (balances) {
          const nonNativeRuneAssets = balances
          // get ETH.RUNE and BNB.RUNE
          .filter( (balance) => {

            return (balance.asset.chain === 'BNB' && balance.asset.ticker === 'RUNE')
              || (balance.asset.chain === 'ETH' && balance.asset.ticker === 'RUNE');

          })
          // filter out 0 amounts
          .filter( balance => balance.amount.amount().isGreaterThan(0))
          // create Asset
          .map( (balance) => ({
            asset: new Asset(`${balance.asset.chain}.${balance.asset.symbol}`)
          }));

          this.nonNativeRuneAssets = this.userService.sortMarketsByUserBalance(balances, nonNativeRuneAssets);

        } else {
          this.nonNativeRuneAssets = [];
        }

      }
    );

    this.mode = 'SELECT_ASSET';
    this.assets = this.nonNativeRuneAssets;
  }

  ngOnInit(): void {
  }

  selectAsset(asset: Asset) {
    const withBalance = this.assets.find( (anb) => `${anb.asset.chain}.${anb.asset.symbol}` === `${asset.chain}.${asset.symbol}` );
    this.selectedAsset = withBalance;
    this.mode = 'UPGRADE_ASSET';
  }

  transactionSuccessful(hash: string) {
    this.successfulTxHash = hash;
    this.mode = 'SUCCESS';
  }

  confirmUpgradeRune(p: {amount: number}) {
    this.amountToSend = p.amount;
    this.mode = 'CONFIRM';
  }

  close() {
    this.overlaysService.setCurrentView(MainViewsEnum.Swap);
  }
}
