import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserService } from 'src/app/_services/user.service';
import { User } from 'src/app/_classes/user';
import { decryptFromKeystore } from '@xchainjs/xchain-crypto';
import { Client as binanceClient, } from '@xchainjs/xchain-binance';
import { Client as bitcoinClient, } from '@xchainjs/xchain-bitcoin';
import { environment } from 'src/environments/environment';

export type Keystore = {
  address: string
  crypto: {
    cipher: string
    ciphertext: string
    cipherparams: {
      iv: string
    }
    kdf: string
    kdfparams: {
      prf: string
      dklen: number
      salt: string
      c: number
    }
    mac: string
  }
  id: string
  version: number
  meta: string
};

@Component({
  selector: 'app-keystore-connect',
  templateUrl: './keystore-connect.component.html',
  styleUrls: ['./keystore-connect.component.scss']
})
export class KeystoreConnectComponent implements OnInit {

  keystorePassword: string;
  keystoreFile: File;
  keystoreFileSelected: boolean;
  keystore;
  keystoreConnecting: boolean;
  keystoreError: boolean;
  @Output() back: EventEmitter<null>;
  @Output() closeModal: EventEmitter<null>;

  constructor(private userService: UserService) {
    this.back = new EventEmitter<null>();
    this.closeModal = new EventEmitter<null>();
  }

  ngOnInit(): void {
  }

  clearKeystore() {
    this.keystorePassword = '';
    this.keystoreFile = null;
    this.keystoreFileSelected = false;
    this.back.emit();
  }

  async onKeystoreFileChange(event: Event) {
    this.keystoreFileSelected = true;

    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files && files.length > 0) {

      const keystoreFile = files[0];

      const reader = new FileReader();

      const onLoadHandler = () => {
        try {
          const key = JSON.parse(reader.result as string);
          if (!('version' in key) || !('crypto' in key)) {
            console.error('not a valid keystore file');
          } else {
            this.keystore = key;
          }
        } catch {
          console.error('not a valid json file');
        }
      };
      reader.addEventListener('load', onLoadHandler);

      await reader.readAsText(keystoreFile);

    }

  }

  async keystoreUnlockClicked() {

    this.keystoreConnecting = true;

    setTimeout(() => {
      this.keystoreUnlock();
    }, 100);

  }

  async keystoreUnlock() {

    this.keystoreError = false;

    try {

      const phrase = await decryptFromKeystore(this.keystore, this.keystorePassword);
      const network = environment.network === 'testnet' ? 'testnet' : 'mainnet';
      const blockchairUrl = (environment.network === 'testnet') ? 'https://api.blockchair.com/bitcoin/testnet' : 'https://api.blockchair.com/bitcoin';

      const userBinanceClient = new binanceClient({network, phrase});
      const userBtcClient = new bitcoinClient({network, phrase, nodeUrl: blockchairUrl, nodeApiKey: 'A___QJPUZs1cbpbK2wkKeiQoixbFnxwg'});

      const user = new User({
        type: 'keystore',
        wallet: this.keystore.address,
        keystore: this.keystore,
        clients: {
          binance: userBinanceClient,
          bitcoin: userBtcClient
        }
      });

      this.userService.setUser(user);

    } catch (error) {
      this.keystoreConnecting = false;
      this.keystoreError = true;
      console.error(error);
    }

  }

  backClicked() {
    this.back.emit();
  }

}
