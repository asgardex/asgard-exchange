import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserService } from 'src/app/_services/user.service';
import { User } from 'src/app/_classes/user';
import { getAddressFromPrivateKey, getPrivateKeyFromKeyStore } from '@binance-chain/javascript-sdk/lib/crypto';
import { BinanceService } from 'src/app/_services/binance.service';

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

  constructor(private userService: UserService, private binanceService: BinanceService) {
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

      const privateKey = getPrivateKeyFromKeyStore(this.keystore, this.keystorePassword);

      await this.binanceService.bncClient.setPrivateKey(privateKey);

      const prefix = this.binanceService.getPrefix();
      const address = getAddressFromPrivateKey(privateKey, prefix);
      const user = new User({type: 'keystore', wallet: address, keystore: this.keystore});

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
