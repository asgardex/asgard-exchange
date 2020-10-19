import { Component, EventEmitter, Output } from '@angular/core';
import { getAddressFromPublicKey } from '@binance-chain/javascript-sdk/lib/crypto';
import { BinanceService } from 'src/app/_services/binance.service';
import u2f_transport from '@ledgerhq/hw-transport-u2f';
import { UserService } from 'src/app/_services/user.service';
import { User } from 'src/app/_classes/user';
const binanceChain = require('@binance-chain/javascript-sdk');

@Component({
  selector: 'app-ledger-connect',
  templateUrl: './ledger-connect.component.html',
  styleUrls: ['./ledger-connect.component.scss']
})
export class LedgerConnectComponent {

  @Output() back: EventEmitter<null>;
  @Output() closeModal: EventEmitter<null>;
  ledgerApp;
  confirmed: boolean;
  addresses: string[];
  selectedAddress: string;
  view: 'pendingConnect' | 'selectAddress' | 'pendingConfirmation' | 'error';
  loading: boolean;

  constructor(private binanceService: BinanceService, private userService: UserService) {
    this.back = new EventEmitter<null>();
    this.closeModal = new EventEmitter<null>();
    this.view = 'pendingConnect';
  }

  async connectLedger() {

    this.loading = true;

    // use the u2f transport
    const ledger = binanceChain.ledger;
    ledger.transports.u2f = u2f_transport;

    const timeout = 50000;
    const transport = await ledger.transports.u2f.create(timeout);
    console.log('LEDGER DEBUG: CREATING TRANSPORT 2');
    this.ledgerApp = new ledger.app(transport, 100000, 100000);

    this.addresses = await this.getLedgerAddresses();
    this.view = 'selectAddress';

    this.loading = false;

  }

  async getLedgerAddresses(): Promise<string[]> {
    const addresses = [];

    for (let index = 0; index < 4; index++) {

      const hdPath = [44, 714, 0, 0, index];

      // get public key
      const pk =  (await this.ledgerApp.getPublicKey(hdPath)).pk;

      // get address from pubkey
      const address = getAddressFromPublicKey(
        pk,
        this.binanceService.getPrefix(),
      );

      addresses.push(address);

    }

    return addresses;

  }

  async selectAddress() {

    this.view = 'pendingConfirmation';

    try {
      const index = this.addresses.indexOf(this.selectedAddress);
      const hdPath = [44, 714, 0, 0, index];
      const _ = await this.ledgerApp.showAddress(this.binanceService.getPrefix(), hdPath); // results
      const user = new User({type: 'ledger', wallet: this.selectedAddress, ledger: this.ledgerApp, hdPath});
      this.userService.setUser(user);
    } catch (error) {
      console.error('error selecting address: ', error);
    }

  }

  onBackClick() {
    this.back.emit();
  }

}
