import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-connect-error',
  templateUrl: './connect-error.component.html',
  styleUrls: ['./connect-error.component.scss']
})
export class ConnectErrorComponent implements OnInit {

  @Output() back: EventEmitter<null>;

  constructor() {
    this.back = new EventEmitter<null>();
  }

  ngOnInit(): void {
  }

}
