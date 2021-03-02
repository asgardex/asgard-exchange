import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-arrow',
  templateUrl: './arrow.component.html',
  styleUrls: ['./arrow.component.scss']
})
export class ArrowComponent implements OnInit {

  selectedSourceAsset: boolean;
  selectedTargetAsset: boolean;
  seperator: boolean = true;

  constructor() { }

  ngOnInit(): void {
  }

  reverseTransaction() {

  }

}
