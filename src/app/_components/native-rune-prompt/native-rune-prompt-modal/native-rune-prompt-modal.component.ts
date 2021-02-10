import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Asset } from 'src/app/_classes/asset';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';

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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {assets: AssetAndBalance[]},
    public dialogRef: MatDialogRef<NativeRunePromptModalComponent>,
  ) {
    this.mode = 'SELECT_ASSET';
    this.assets = data.assets;
  }

  ngOnInit(): void {
  }

  selectAsset(asset: Asset) {
    const withBalance = this.assets.find( (anb) => `${anb.asset.chain}.${anb.asset.symbol}` === `${asset.chain}.${asset.symbol}` );
    this.selectedAsset = withBalance;
    this.mode = 'UPGRADE_ASSET';
  }

  confirmUpgradeRune(p: {amount: number}) {
    this.amountToSend = p.amount;
    this.mode = 'CONFIRM';
  }

}
