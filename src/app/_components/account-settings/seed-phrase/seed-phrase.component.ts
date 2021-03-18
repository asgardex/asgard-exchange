import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { decryptFromKeystore, encryptToKeyStore } from '@xchainjs/xchain-crypto';
import { CopyService } from 'src/app/_services/copy.service';
import { KeystoreService } from 'src/app/_services/keystore.service';
import { environment } from 'src/environments/environment';


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

  constructor(private copyService: CopyService, private keystoreService: KeystoreService) { }

  ngOnInit(): void {
  }

  copyToClipboard() {
    this.copyService.copyToClipboard(this.phrase);
  }

  async downloadKeystore() {

    try {
      const keystore = await encryptToKeyStore(this.phrase, this.keystorePassword);

      localStorage.setItem('keystore', JSON.stringify(keystore));
      const user = await this.keystoreService.unlockKeystore(keystore, this.keystorePassword);

      const binanceAddress = await user.clients.binance.getAddress();
      const addressLength = binanceAddress.length;
      const minAddress = `${binanceAddress.substring(0, environment.network === 'testnet' ? 7 : 6)}_${binanceAddress.substring(addressLength - 3, addressLength)}`;
      const bl = new Blob([JSON.stringify(keystore)], {
        type: 'text/plain'
      });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(bl);
      a.download = `asgardex-${minAddress}`;
      a.hidden = true;
      document.body.appendChild(a);
      a.innerHTML =
        'loading';
      a.click();

    } catch (error) {
      console.error(error);
    }

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
