import { Component, EventEmitter, OnInit, Output } from '@angular/core';
const binanceChain = require('@binance-chain/javascript-sdk');
import { getAddressFromPublicKey } from '@binance-chain/javascript-sdk/lib/crypto';
import { BinanceService } from 'src/app/_services/binance.service';
import u2f_transport from '@ledgerhq/hw-transport-u2f';

@Component({
  selector: 'app-ledger-connect',
  templateUrl: './ledger-connect.component.html',
  styleUrls: ['./ledger-connect.component.scss']
})
export class LedgerConnectComponent implements OnInit {

  @Output() back: EventEmitter<null>;
  connected: boolean;
  confirmed: boolean;

  constructor(private binanceService: BinanceService) {
    this.back = new EventEmitter<null>();
  }

  ngOnInit(): void {
    console.log('ledger is: ', binanceChain.ledger);
  }

  async connectLedger() {

    // const bncClient = this.binanceService.bncClient;

    // const ledgerIndex = 0;

    // use the u2f transport
    console.log('[+] LEDGER DEBUG: CREATING TRANSPORT');
    const ledger = binanceChain.ledger;

    ledger.transports.u2f = u2f_transport;

    const timeout = 50000;
    const transport = await ledger.transports.u2f.create(timeout);
    console.log('LEDGER DEBUG: CREATING TRANSPORT 2');
    const app = new ledger.app(transport, 100000, 100000);

    const addresses = this.getLedgerAddresses(app);

  }

  async getLedgerAddresses(app): Promise<string[]> {
    const addresses = [];

    for (let index = 0; index < 4; index++) {
      // const element = array[index];

      const hdPath = [44, 714, 0, 0, index];

      console.log('[+] LEDGER DEBUG: GETTING VERSION');
      // get version
      try {
        const version = await app.getVersion();
        console.log('LEDGER DEBUG: APP VERSION: ', version);
      } catch ({ message, statusCode }) {
        console.error('LEDGER DEBUG: VERSION ERROR: ', message, statusCode);
      }

      console.log('[+] LEDGER DEBUG: GETTING PUBLIC KEY');
      // get public key
      const pk =  (await app.getPublicKey(hdPath)).pk;

      // get address from pubkey
      const address = getAddressFromPublicKey(
        pk,
        this.binanceService.getPrefix(),
      );

      console.log('ADDRESS IS: ', address);
      addresses.push(address);

    }

    console.log('addresses is: ', addresses);

    return addresses;

  }

  onBackClick() {
    this.back.emit();
  }

}
