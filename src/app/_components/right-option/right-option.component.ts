import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-right-option',
  templateUrl: './right-option.component.html',
  styleUrls: ['./right-option.component.scss']
})
export class RightOptionComponent implements OnInit {

  @Input() whichType: 'SWITCH' | 'FIELD' | 'BUTTON' = 'SWITCH';

  constructor() { }

  ngOnInit(): void {
  }

}
