import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-phrase-words-list',
  templateUrl: './phrase-words-list.component.html',
  styleUrls: ['./phrase-words-list.component.scss'],
})
export class PhraseWordsListComponent implements OnInit {
  @Input() phrase: string;
  phraseWords: string[];

  constructor() {
    this.phraseWords = [];
  }

  ngOnInit(): void {
    if (this.phrase) {
      this.phraseWords = this.phrase.split(' ');
    }
  }
}
