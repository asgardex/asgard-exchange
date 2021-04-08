import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhraseWordsListComponent } from './phrase-words-list.component';



@NgModule({
  declarations: [PhraseWordsListComponent],
  imports: [
    CommonModule
  ],
  exports: [PhraseWordsListComponent]
})
export class PhraseWordsListModule { }
