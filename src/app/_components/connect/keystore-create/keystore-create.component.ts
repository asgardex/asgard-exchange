import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { generatePhrase, encryptToKeyStore } from '@xchainjs/xchain-crypto';

@Component({
  selector: 'app-keystore-create',
  templateUrl: './keystore-create.component.html',
  styleUrls: ['./keystore-create.component.scss']
})
export class KeystoreCreateComponent implements OnInit {

  @Output() back: EventEmitter<null>;
  @Output() closeModal: EventEmitter<null>;
  password: string;
  phrase: string;
  loading: boolean;
  error: boolean;

  constructor() {
    this.loading = false;
    this.phrase = generatePhrase();
    this.back = new EventEmitter<null>();
    this.closeModal = new EventEmitter<null>();
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
    this.back.emit();
  }

  // back() {
  //   // this.dialogRef.close();
  // }

}
