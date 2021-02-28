import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpgradeRuneComponent } from './upgrade-rune.component';
import { MatIconModule } from '@angular/material/icon';
import { AssetInputModule } from '../asset-input/asset-input.module';
import { MatButtonModule } from '@angular/material/button';



@NgModule({
  declarations: [UpgradeRuneComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    AssetInputModule
  ],
  exports: [UpgradeRuneComponent]
})
export class UpgradeRuneModule { }
