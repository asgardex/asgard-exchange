import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserService } from 'src/app/_services/user.service';
import { User } from 'src/app/_classes/user';
import { WalletService } from 'src/app/_services/wallet.service';
import { getAddressFromPrivateKey, getPrivateKeyFromKeyStore } from '@binance-chain/javascript-sdk/lib/crypto';

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

  constructor(private userService: UserService, private walletService: WalletService) {
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
    // this.connectionMethod = null;
  }

  async onKeystoreFileChange(event: Event) {
    this.keystoreFileSelected = true;

    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files && files.length > 0) {
      console.log(files);

      const keystoreFile = files[0];

      const reader = new FileReader();

      const onLoadHandler = () => {
        try {
          const key = JSON.parse(reader.result as string);
          if (!('version' in key) || !('crypto' in key)) {
            console.error('not a valid keystore file');
          } else {
            console.log('success? ', key);
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

      await this.walletService.bncClient.setPrivateKey(privateKey);

      const prefix = this.walletService.asgardexBncClient.getPrefix();
      const address = getAddressFromPrivateKey(privateKey, prefix);

      console.log('address is: ', address);

      const user = new User({type: 'keystore', wallet: address, keystore: this.keystore});

      this.userService.setUser(user);
      this.closeModal.emit();

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
