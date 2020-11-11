import { Component, EventEmitter, Input, Output } from '@angular/core';
import { getAddressFromPublicKey } from '@binance-chain/javascript-sdk/lib/crypto';
import { BinanceService } from 'src/app/_services/binance.service';
import u2f_transport from '@ledgerhq/hw-transport-u2f';
import { UserService } from 'src/app/_services/user.service';
import { User } from 'src/app/_classes/user';
import Btc from '@ledgerhq/hw-app-btc';
const binanceChain = require('@binance-chain/javascript-sdk');

@Component({
  selector: 'app-ledger-connect',
  templateUrl: './ledger-connect.component.html',
  styleUrls: ['./ledger-connect.component.scss']
})
export class LedgerConnectComponent {

  @Input() chain: 'BNB' | 'BTC';
  @Output() back: EventEmitter<null>;
  @Output() closeModal: EventEmitter<null>;
  binanceLedgerApp;
  bitcoinLedgerApp;
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

    let ledger;
    this.loading = true;
    const timeout = 50000;

    if (!this.chain) {
      console.error('no chain selected');
      this.loading = false;
      return;
    }

    if (this.chain === 'BNB') {
      // use the u2f transport
      ledger = binanceChain.ledger;
      ledger.transports.u2f = u2f_transport;

      const transport = await ledger.transports.u2f.create(timeout);
      console.log('LEDGER DEBUG: CREATING TRANSPORT 2');
      this.binanceLedgerApp = new ledger.app(transport, 100000, 100000);
      this.addresses = await this.getBnbAddresses();
    } else if (this.chain === 'BTC') {
      const transport = await u2f_transport.create(timeout);
      this.bitcoinLedgerApp = new Btc(transport);
      this.addresses = await this.getBtcAddresses();
    }

    this.view = 'selectAddress';

    this.loading = false;

  }

  async getBtcAddresses(): Promise<string[]> {

  // Bitcoin (84/0/0/0)
  // Binance Chain (44/714/0/0)
  // Ethereum (44/30/0/0)
  // THORChain (44/931/0/0)
  // Cosmos ( 44/118/0/0)

    const addresses = [];

    for (let index = 0; index < 1; index++) {
      // const hdPath = [84, 0, 0, 0, index];
      // console.log('hd path is: ', hdPath);
      const res = await this.bitcoinLedgerApp.getWalletPublicKey(`84'/0'/0'/0/${index}`, { format: 'bech32' });
      console.log('ADDRESS res is: ', res);
      addresses.push(res.bitcoinAddress);

    }

    console.log('addresses are: ', addresses);

    return addresses;
  }

  async getBnbAddresses(): Promise<string[]> {
    const addresses = [];

    for (let index = 0; index < 4; index++) {

      const hdPath = [44, 714, 0, 0, index];

      // get public key
      const pk = (await this.binanceLedgerApp.getPublicKey(hdPath)).pk;

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

    if (this.chain === 'BNB') {
      this.view = 'pendingConfirmation';
    }

    try {
      const index = this.addresses.indexOf(this.selectedAddress);
      const hdPath = [44, 714, 0, 0, index];
      const _ = await this.binanceLedgerApp.showAddress(this.binanceService.getPrefix(), hdPath); // results
      const user = new User({type: 'ledger', wallet: this.selectedAddress, ledger: this.binanceLedgerApp, hdPath, clients: {}});
      this.userService.setUser(user);
    } catch (error) {
      console.error('error selecting address: ', error);
    }

  }

  onBackClick() {
    this.back.emit();
  }

}
