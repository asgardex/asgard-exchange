import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-connect-error',
  templateUrl: './connect-error.component.html',
  styleUrls: ['./connect-error.component.scss'],
})
export class ConnectErrorComponent {
  @Output() back: EventEmitter<null>;

  constructor() {
    this.back = new EventEmitter<null>();
  }
}
