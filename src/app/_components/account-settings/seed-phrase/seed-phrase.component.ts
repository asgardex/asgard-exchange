import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { decryptFromKeystore } from '@xchainjs/xchain-crypto';
import { CopyService } from 'src/app/_services/copy.service';

@Component({
  selector: 'app-seed-phrase',
  templateUrl: './seed-phrase.component.html',
  styleUrls: ['./seed-phrase.component.scss']
})
export class SeedPhraseComponent implements OnInit {

  @Output() close: EventEmitter<null> = new EventEmitter<null>();
  passwordAccepted: boolean;
  keystoreConnecting: boolean;
  keystorePassword: string;
  keystoreError: boolean;
  phrase: string;

  constructor(private copyService: CopyService) { }

  ngOnInit(): void {
  }

  copyToClipboard() {
    this.copyService.copyToClipboard(this.phrase);
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
