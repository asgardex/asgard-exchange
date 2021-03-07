import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoticeComponent } from './notice.component'
import { TagModule } from '../tag/tag.module';


@NgModule({
  declarations: [NoticeComponent],
  imports: [
    CommonModule,
    TagModule
  ],
  exports: [NoticeComponent]
})
export class NoticeModule { }
