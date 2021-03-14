import { Component, Input, OnInit, Output, ViewChild, EventEmitter } from '@angular/core';
import { OverlaysService, MainViewsEnum, SwapViews } from 'src/app/_services/overlays.service';

export type Path = {
  name: string,
  disable?: boolean,
  mainView?: string,
  swapView?: SwapViews,
  backFunc?: boolean,
  call?: string
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
  @Input() isError: boolean = false;
  @Input() backName?: string = null;
  @Output() backFunc: EventEmitter<null>;
  @Output() funcCaller: EventEmitter<string>;

  constructor(private overlaysService: OverlaysService) {
    this.backFunc = new EventEmitter<null>();
    this.funcCaller = new EventEmitter<string>();
  }

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

  navHandler(path: Path) {
    if(!path.disable) {
      path.backFunc ? this.backFunc.emit() : path.call ? this.funcCaller.emit(path.call) : this.changePath(path)
    }
  }
}
