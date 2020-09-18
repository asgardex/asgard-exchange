import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  isTestnet: boolean;

  constructor() {
    this.isTestnet = environment.network === 'testnet' ? true : false;
  }

  ngOnInit(): void {
  }

}
