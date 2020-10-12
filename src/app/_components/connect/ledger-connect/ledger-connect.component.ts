import { Component, EventEmitter, OnInit, Output } from '@angular/core';
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
export class LedgerConnectComponent implements OnInit {

  @Output() back: EventEmitter<null>;
  @Output() closeModal: EventEmitter<null>;
  ledgerApp;
  confirmed: boolean;
  addresses: string[];
  selectedAddress: string;
  view: 'pendingConnect' | 'selectAddress' | 'pendingConfirmation' | 'error';

  constructor(private binanceService: BinanceService, private userService: UserService) {
    this.back = new EventEmitter<null>();
    this.closeModal = new EventEmitter<null>();
    this.view = 'pendingConnect';
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
    this.ledgerApp = new ledger.app(transport, 100000, 100000);

    this.addresses = await this.getLedgerAddresses();
    this.view = 'selectAddress';

  }

  async getLedgerAddresses(): Promise<string[]> {
    const addresses = [];

    for (let index = 0; index < 4; index++) {
      // const element = array[index];

      const hdPath = [44, 714, 0, 0, index];

      console.log('[+] LEDGER DEBUG: GETTING VERSION');
      // get version
      try {
        const version = await this.ledgerApp.getVersion();
        console.log('LEDGER DEBUG: APP VERSION: ', version);
      } catch ({ message, statusCode }) {
        console.error('LEDGER DEBUG: VERSION ERROR: ', message, statusCode);
      }

      console.log('[+] LEDGER DEBUG: GETTING PUBLIC KEY');
      // get public key
      const pk =  (await this.ledgerApp.getPublicKey(hdPath)).pk;

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

  async selectAddress() {

    this.view = 'pendingConfirmation';

    try {
      const index = this.addresses.indexOf(this.selectedAddress);
      console.log('selected address is:', this.selectedAddress);
      console.log('addresses are: ', this.addresses);
      console.log('index is: ', index);
      const hdPath = [44, 714, 0, 0, index];
      const _ = await this.ledgerApp.showAddress(this.binanceService.getPrefix(), hdPath); // results
      const user = new User({type: 'ledger', wallet: this.selectedAddress, ledger: this.ledgerApp, hdPath});
      this.userService.setUser(user);

    } catch (error) {
      console.error('error selecting address: ', error);
    }






    // // Sort first by user balances
    // this.userService.userBalances$.subscribe((balances) => {
    //   if(!balances) return
    //   //This part is sorted correctly
    //   const sortedBalances = balances.sort((a,b) => a.assetValue.amount().toNumber() < b.assetValue.amount().toNumber() ? 1 : -1)
    //   const userAssetList = sortedBalances.map(b => b.asset)


    //   //But this filtered list is not getting sorted, BEFORE and AFTER are same
    //   console.log('Filtered list before:', this.filteredMarketListItems)
    //   const sortedList = this.filteredMarketListItems.sort((a,b)=>{
    //     return userAssetList.indexOf(a.symbol) - userAssetList.indexOf(b.symbol)
    //   })
    //   console.log('Filtererd After:', this.filteredMarketListItems)
    //   console.log('Sorted list:', sortedList)
    // })







  }

  onBackClick() {
    this.back.emit();
  }

}
