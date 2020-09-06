import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { crypto } from '@binance-chain/javascript-sdk';
import {
  Client as binanceClient,
  BinanceClient,
} from '@thorchain/asgardex-binance';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.component.html',
  styleUrls: ['./connect.component.scss']
})
export class ConnectComponent implements OnInit {

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
  }

  openDialog() {
    this.dialog.open(
      ConnectModal,
      {
        width: '50vw',
        maxWidth: '420px'
      }
    );
  }

}

export enum ConnectionMethod {
  WALLET_CONNECT  = 'WALLET_CONNECT',
  KEYSTORE        = 'KEYSTORE'
}

// export interface Keystore {

// }

@Component({
  selector: 'app-connect-modal',
  templateUrl: 'connect-modal.component.html',
  styleUrls: ['./connect.component.scss']
})
// tslint:disable-next-line:component-class-suffix
export class ConnectModal {

  connectionMethod: ConnectionMethod;

  keystorePassword: string;
  keystoreFile;
  keystoreFileSelected: boolean;
  keystore;

  connectWalletConnect() {

    this.connectionMethod = ConnectionMethod.WALLET_CONNECT;

    console.log('connect clicked');

  }

  connectKeystore() {

    this.connectionMethod = ConnectionMethod.KEYSTORE;

    console.log('connect keystore');
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
            // setKeystoreError('Not a valid keystore file');
          } else {
            // setKeystoreError(Nothing);
            // setKeystore(key);
            console.log('success? ', key);
            this.keystore = key;
          }
        } catch {
          // setKeystoreError('Not a valid json file');
          console.error('not a valid json file');
        }
      };
      reader.addEventListener('load', onLoadHandler);

      const blob = await reader.readAsText(keystoreFile);

      // reader.removeEventListener('load', onLoadHandler);


    }


  }

  keystoreUnlock() {
    try {
      const privateKey = crypto.getPrivateKeyFromKeyStore(this.keystore, this.keystorePassword);


      const asgardexBncClient: BinanceClient = new binanceClient({
        network: 'testnet',
      });


      const address = crypto.getAddressFromPrivateKey(
        privateKey,
        asgardexBncClient.getPrefix(),
      );

      console.log('address is: ', address);

      // saveWallet({
      //   type: 'keystore',
      //   wallet: address,
      //   keystore,
      // });

      // // clean up
      // setPassword(Nothing);
      // setKeystore(Nothing);

      // // redirect to previous page
      // history.goBack();
    } catch (error) {
      // setInvalideStatus(true);
      console.error(error);
    }
    // setProcessing(false);
  }

  clearKeystore() {
    this.keystorePassword = '';
    this.keystoreFile = null;
    this.keystoreFileSelected = false;
    this.connectionMethod = null;
  }

}
