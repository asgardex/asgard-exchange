import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserService } from 'src/app/_services/user.service';
import { User } from 'src/app/_classes/user';
import { decryptFromKeystore } from '@thorchain/asgardex-crypto';
import { Client as binanceClient, } from '@xchainjs/xchain-binance';
import { Client as bitcoinClient, } from '@xchainjs/xchain-bitcoin';
import { BinanceService } from 'src/app/_services/binance.service';
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

      console.log('keystore password is: ', this.keystorePassword);
      console.log('this keystore is: ', this.keystore);

      // const privateKey = getPrivateKeyFromKeyStore(this.keystore, this.keystorePassword);
      const phrase = await decryptFromKeystore(this.keystore, this.keystorePassword); // this throws an error

      // console.log('private key is: ', privateKey);

      // await this.binanceService.bncClient.setPrivateKey(privateKey);

      // const prefix = this.binanceService.getPrefix();
      // const address = getAddressFromPrivateKey(privateKey, prefix);
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


      // // const binanceAddress = await user.clients.binance.getAddress();
      // // console.log('binance address is: ', binanceAddress);
      // const binanceBalances = await user.clients.binance.getBalance();
      // console.log('binance balances are: ', binanceBalances);
      // for (const balance of binanceBalances) {
      //   console.log(`${balance.asset.symbol} amount: ${balance.amount.amount().div(10 ** balance.amount.decimal).toNumber()}`);
      // }
      // // const binanceBalances2 = await user.clients.binance.getBalance();
      // // console.log('binance balances 222 are: ', binanceBalances2);
      // const bitcoinAddress = await user.clients.bitcoin.getAddress();
      // console.log('bitcoin address is: ', bitcoinAddress);
      // const bitcoinBalance = await user.clients.bitcoin.getBalance();
      // for (const balance of bitcoinBalance) {
      //   console.log('decimal is: ', balance.amount.decimal);
      //   console.log(`${balance.asset.symbol} amount: ${balance.amount.amount().div(10 ** balance.amount.decimal).toNumber()}`);
      // }

    } catch (error) {
      this.keystoreConnecting = false;
      this.keystoreError = true;
      console.error(error);
    }

  }

  backClicked() {
    this.back.emit();
  }

  // // Taken from asgardex-crypto
  // // was throwing browser-related errors
  // decryptFromKeystore = async (keystore: Keystore, password: string): Promise<string> => {
  //   const kdfparams = keystore.crypto.kdfparams;
  //   const hashFunction = 'sha256';

  //   console.log('aaaa');

  //   try {
  //     const derivedKey = await crypto.pbkdf2Sync(
  //       Buffer.from(password),
  //       Buffer.from(kdfparams.salt, 'hex'),
  //       kdfparams.c,
  //       kdfparams.dklen,
  //       hashFunction
  //     );

  //     console.log('bbbb: keystore.crypto.ciphertext', keystore.crypto.ciphertext);

  //     const ciphertext = Buffer.from(keystore.crypto.ciphertext, 'hex');

  //     console.log('ciphertext is: ', ciphertext);

  //     const mac = blake256(Buffer.concat([derivedKey.slice(16, 32), ciphertext]));

  //     console.log('ddd mac is: ', mac);
  //     console.log('keystore crypto mac is: ', keystore.crypto.mac);

  //     if (mac !== keystore.crypto.mac) {
  //       return Promise.reject('invalid password');
  //     }
  //     const decipher = crypto.createDecipheriv(
  //       keystore.crypto.cipher,
  //       derivedKey.slice(0, 16),
  //       Buffer.from(keystore.crypto.cipherparams.iv, 'hex')
  //     );

  //     const phrase = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  //     return Promise.resolve(phrase.toString('utf8'));
  //   } catch (error) {
  //     return Promise.reject(error);
  //   }
  // }

}
