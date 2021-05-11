import { Component, EventEmitter, Output } from '@angular/core';
import { decryptFromKeystore } from '@xchainjs/xchain-crypto';

@Component({
  selector: 'app-view-phrase',
  templateUrl: './view-phrase.component.html',
  styleUrls: ['./view-phrase.component.scss'],
})
export class ViewPhraseComponent {
  @Output() back: EventEmitter<null>;
  passwordAccepted: boolean;
  keystoreConnecting: boolean;
  keystorePassword: string;
  keystoreError: boolean;
  phrase: string;

  constructor() {
    this.back = new EventEmitter();
  }

  async unlock() {
    try {
      const keystoreString = localStorage.getItem('keystore');
      const keystore = JSON.parse(keystoreString);
      this.phrase = await decryptFromKeystore(keystore, this.keystorePassword);
      this.passwordAccepted = true;
      this.keystoreError = false;
    } catch (error) {
      this.keystoreConnecting = false;
      this.keystoreError = true;
      console.error(error);
    }
  }
}
