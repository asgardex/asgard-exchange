import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-section-head',
  templateUrl: './section-head.component.html',
  styleUrls: ['./section-head.component.scss'],
})
export class SectionHeadComponent {
  @Input() sectionTitle: string;
  @Input() displayBackBtn: boolean;
  @Output() back: EventEmitter<null>;

  constructor() {
    this.back = new EventEmitter<null>();
    this.displayBackBtn = false;
  }
}
