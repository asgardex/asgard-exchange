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
  @Output() back: EventEmitter<null>;

  constructor() {
    this.displayBackBtn = false;
    this.back = new EventEmitter<null>();
  }

  ngOnInit(): void {
  }

}
