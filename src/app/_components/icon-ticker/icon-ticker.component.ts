import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-icon-ticker',
  templateUrl: './icon-ticker.component.html',
  styleUrls: ['./icon-ticker.component.scss']
})
export class IconTickerComponent implements OnInit {

  @Input() iconPath: string;
  @Input() ticker: string;
  @Input() chain: string;

  constructor() { }

  ngOnInit(): void {
  }

}
