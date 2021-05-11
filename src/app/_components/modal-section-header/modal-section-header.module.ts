import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalSectionHeaderComponent } from './modal-section-header.component';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [ModalSectionHeaderComponent],
  imports: [CommonModule, MatIconModule],
  exports: [ModalSectionHeaderComponent],
})
export class ModalSectionHeaderModule {}
