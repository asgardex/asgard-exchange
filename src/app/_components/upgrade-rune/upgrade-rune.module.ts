import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpgradeRuneComponent } from './upgrade-rune.component';
import { MatIconModule } from '@angular/material/icon';
import { AssetInputModule } from '../asset-input/asset-input.module';
import { MatButtonModule } from '@angular/material/button';
import { ModalSectionHeaderModule } from '../modal-section-header/modal-section-header.module';
import { ArrowModule } from '../arrow/arrow.module';
import { BreadcrumbModule } from '../breadcrumb/breadcrumb.module';



@NgModule({
  declarations: [UpgradeRuneComponent],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    AssetInputModule,
    ArrowModule,
    BreadcrumbModule,
    ModalSectionHeaderModule
  ],
  exports: [UpgradeRuneComponent]
})
export class UpgradeRuneModule { }
