import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-keystore-create-store-phrase',
  templateUrl: './keystore-create-store-phrase.component.html',
  styleUrls: ['./keystore-create-store-phrase.component.scss']
})
export class KeystoreCreateStorePhraseComponent implements OnInit {

  @Input() phrase: string;
  @Output() closeModal: EventEmitter<null>;

  constructor() {
    this.closeModal = new EventEmitter<null>();
  }

  ngOnInit(): void {
  }

}
