import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { generatePhrase, validatePhrase, encryptToKeyStore, decryptFromKeystore, Keystore, getAddress, getSeed } from '@thorchain/asgardex-crypto';

@Component({
  selector: 'app-keystore-create',
  templateUrl: './keystore-create.component.html',
  styleUrls: ['./keystore-create.component.scss']
})
export class KeystoreCreateComponent implements OnInit {

  password: string;
  phrase: string;
  loading: boolean;
  error: boolean;

  constructor(public dialogRef: MatDialogRef<KeystoreCreateComponent>) {
    this.loading = false;
    this.phrase = generatePhrase();
    console.log('phrase is: ', this.phrase);
  }

  ngOnInit(): void {
  }

  async createKeystore() {
    const keystore = await encryptToKeyStore(this.phrase, this.password);

    // let data = "Whatever it is you want to save";
    const bl = new Blob([JSON.stringify(keystore)], {
       type: 'text/plain'
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(bl);
    a.download = 'asgardex-keystore';
    a.hidden = true;
    document.body.appendChild(a);
    a.innerHTML =
       'loading';
    a.click();
    this.close();
  }

  close() {
    this.dialogRef.close();
  }

}
