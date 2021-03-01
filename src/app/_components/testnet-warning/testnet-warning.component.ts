import { Component, Input, OnInit } from '@angular/core';
import { Chain } from '@xchainjs/xchain-util';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-testnet-warning',
  templateUrl: './testnet-warning.component.html',
  styleUrls: ['./testnet-warning.component.scss']
})
export class TestnetWarningComponent implements OnInit {

  @Input() chain?: Chain | null;
  isTestnet: boolean;

  constructor() {
    this.isTestnet = environment.network === 'testnet';
  }

  ngOnInit(): void {
  }

}
