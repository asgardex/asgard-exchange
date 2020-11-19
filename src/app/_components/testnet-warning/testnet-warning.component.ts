import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-testnet-warning',
  templateUrl: './testnet-warning.component.html',
  styleUrls: ['./testnet-warning.component.scss']
})
export class TestnetWarningComponent implements OnInit {

  isTestnet: boolean;

  constructor() {
    this.isTestnet = environment.network === 'testnet';
  }

  ngOnInit(): void {
  }

}
