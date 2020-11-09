import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { generatePhrase, encryptToKeyStore } from '@xchainjs/xchain-crypto';
import { KeystoreService } from 'src/app/_services/keystore.service';
import { UserService } from 'src/app/_services/user.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-keystore-create',
  templateUrl: './keystore-create.component.html',
  styleUrls: ['./keystore-create.component.scss']
})
export class KeystoreCreateComponent implements OnInit {

  @Output() back: EventEmitter<null>;
  @Output() closeModal: EventEmitter<null>;
  password: string;
  confirmPassword: string;
  phrase: string;
  loading: boolean;
  error: boolean;

  constructor(private userService: UserService, private keystoreService: KeystoreService) {
    this.loading = false;
    this.phrase = generatePhrase();
    this.back = new EventEmitter<null>();
    this.closeModal = new EventEmitter<null>();
  }

  ngOnInit(): void {
  }

  async createKeystore() {

    try {
      const keystore = await encryptToKeyStore(this.phrase, this.password);

      localStorage.setItem('keystore', JSON.stringify(keystore));
      const user = await this.keystoreService.unlockKeystore(keystore, this.password);
      this.userService.setUser(user);

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

      this.closeModal.next();
    } catch (error) {
      console.error(error);
    }


    // this.back.emit();
  }

  // back() {
  //   // this.dialogRef.close();
  // }

}
