import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-modal-section-header',
  templateUrl: './modal-section-header.component.html',
  styleUrls: ['./modal-section-header.component.scss']
})
export class ModalSectionHeaderComponent implements OnInit {

  @Input() sectionTitle?: string | null;
  @Input() sectionTitleIcon?: string | null;
  @Input() displayBackBtn: boolean;
  @Input() displayCloseBtn: boolean;
  @Output() back: EventEmitter<null>;
  @Output() close: EventEmitter<null>;

  constructor() {
    this.displayBackBtn = false;
    this.displayCloseBtn = false;
    this.back = new EventEmitter<null>();
    this.close = new EventEmitter<null>();
  }

  ngOnInit(): void {
  }

}
