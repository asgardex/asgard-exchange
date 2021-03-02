import { Component, OnInit, ViewChild } from '@angular/core';


@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {

  @ViewChild('cursor') cursor;

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
