import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionHeadComponent } from './section-head.component';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [SectionHeadComponent],
  imports: [CommonModule, MatIconModule, RouterModule],
  exports: [SectionHeadComponent],
})
export class SectionHeadModule {}
