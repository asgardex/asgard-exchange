import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { OverlaysService, MainViewsEnum, SwapViews } from 'src/app/_services/overlays.service';

export type Path = {
  name: string,
  disable?: boolean,
  mainView?: string,
  swapView?: SwapViews
}

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {

  @ViewChild('cursor') cursor;
  @Input() path: Array<Object> = [{'name': 'TEXT', 'mainView': 'Swap', 'swapView': 'Swap', disable: false}];
  @Input() message: string = "TEXT";
  @Input() isError: boolean = false ;

  constructor(private overlaysService: OverlaysService) { }

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

  changePath(path: Path) {
    if (path.mainView == 'Swap')
      this.overlaysService.setViews(MainViewsEnum.Swap, path.swapView);
    else if(path.mainView == 'Reconnect')
      this.overlaysService.setCurrentView(MainViewsEnum.Reconnect)
    else if(path.mainView == 'User Setting')
      this.overlaysService.setCurrentView(MainViewsEnum.UserSetting)
  }

}
