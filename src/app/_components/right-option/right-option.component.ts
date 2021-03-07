import { Component, OnInit, Input } from '@angular/core';

export type SwitchField = {
  right: {
    text: string,
    tag: string,
    disable: boolean
  },
  left: {
    text: string,
    tag: string,
    disable: boolean
  }
}

@Component({
  selector: 'app-right-option',
  templateUrl: './right-option.component.html',
  styleUrls: ['./right-option.component.scss']
})
export class RightOptionComponent implements OnInit {

  @Input() whichType: 'SWITCH' | 'FIELD' | 'BUTTON' = 'SWITCH';
  @Input() switchField: SwitchField;

  constructor() { }

  ngOnInit(): void {
  }

}
