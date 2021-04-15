import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Asset } from '../_classes/asset';

@Component({
  selector: 'app-deposit-sym-recovery',
  templateUrl: './deposit-sym-recovery.component.html',
  styleUrls: ['./deposit-sym-recovery.component.scss']
})
export class DepositSymRecoveryComponent implements OnInit {

  rune: Asset;

  constructor(private router: Router) {
    this.rune = new Asset('THOR.RUNE');
  }

  ngOnInit(): void {
  }

  back() {
    this.router.navigate(['/', 'pools']);
  }

}
