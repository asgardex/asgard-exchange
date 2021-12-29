import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-assets-list-group-select',
  templateUrl: './assets-list-group-select.component.html',
  styleUrls: ['./assets-list-group-select.component.scss'],
})
export class AssetsListGroupSelectComponent {
  @Input() iconPaths: {
    [key: string]: string;
  };
  @Input() active: boolean;
  @Input() key: string;
  @Output() selectGroup: EventEmitter<null>;

  constructor() {
    this.selectGroup = new EventEmitter<null>();
  }
}
