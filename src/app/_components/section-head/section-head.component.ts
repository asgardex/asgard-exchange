import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-section-head',
  templateUrl: './section-head.component.html',
  styleUrls: ['./section-head.component.scss']
})
export class SectionHeadComponent implements OnInit {

  @Input() backRouterLink?: string[];
  @Input() sectionTitle: string;

  constructor() { }

  ngOnInit(): void {
  }

}
