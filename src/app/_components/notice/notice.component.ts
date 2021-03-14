import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-notice',
  templateUrl: './notice.component.html',
  styleUrls: ['./notice.component.scss']
})
export class NoticeComponent implements OnInit {

  @Input() tags: Array<string> = ['Text', 'Text'];
  @Output() tagClicked = new EventEmitter();
  @Input() isDouble: boolean = false;

  constructor() { }

  ngOnInit(): void {
  }

  onTagClicked(index: number) {
    this.tagClicked.next(index);
  }
}
