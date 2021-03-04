import { Component, Input, OnInit, ViewChild } from '@angular/core';


@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {

  @ViewChild('cursor') cursor;
  @Input() path: Array<string> = ["TEXT"];
  @Input() message: string = "TEXT";
  @Input() isError: boolean = false ;

  constructor() { }

  ngAfterViewInit() {
    setInterval( () => {
      let cursorEl = this.cursor.nativeElement;
      if (cursorEl.style.display === "none") {
        cursorEl.style.display = "block";
      } else {
        cursorEl.style.display = "none";
      }
    }, 500)
  }

  ngOnInit(): void {
  }

}
