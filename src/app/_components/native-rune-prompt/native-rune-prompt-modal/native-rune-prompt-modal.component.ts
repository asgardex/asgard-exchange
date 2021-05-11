import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Asset } from 'src/app/_classes/asset';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';

@Component({
  selector: 'app-native-rune-prompt-modal',
  templateUrl: './native-rune-prompt-modal.component.html',
  styleUrls: ['./native-rune-prompt-modal.component.scss'],
})
export class NativeRunePromptModalComponent {
  assets: AssetAndBalance[];
  loading = false;
  mode: 'SELECT_ASSET' | 'UPGRADE_ASSET' | 'CONFIRM' | 'SUCCESS';
  selectedAsset: AssetAndBalance;
  amountToSend: number;
  successfulTxHash: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { assets: AssetAndBalance[] },
    public dialogRef: MatDialogRef<NativeRunePromptModalComponent>
  ) {
    this.mode = 'SELECT_ASSET';
    this.assets = data.assets;
  }

  selectAsset(asset: Asset) {
    const withBalance = this.assets.find(
      (anb) =>
        `${anb.asset.chain}.${anb.asset.symbol}` ===
        `${asset.chain}.${asset.symbol}`
    );
    this.selectedAsset = withBalance;
    this.mode = 'UPGRADE_ASSET';
  }

  transactionSuccessful(hash: string) {
    this.successfulTxHash = hash;
    this.mode = 'SUCCESS';
  }

  confirmUpgradeRune(p: { amount: number }) {
    this.amountToSend = p.amount;
    this.mode = 'CONFIRM';
  }
}
