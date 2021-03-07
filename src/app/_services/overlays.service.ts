import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type MainViews = 'Reconnect' | 'User Setting' | 'Swap';
export type SwapViews = 'Swap' | 'TargetAsset' | 'SourceAsset' | 'Connect' | 'Confirm';
export enum MainViewsEnum {
  Swap = 'Swap',
  Reconnect = 'Reconnect',
  UserSetting = 'User Setting'
}
@Injectable({
  providedIn: 'root'
})
export class OverlaysService {

  private currentViewSource = new BehaviorSubject<MainViewsEnum>(MainViewsEnum.Swap);
  currentView = this.currentViewSource.asObservable();

  private innerSwapView: SwapViews;

  constructor() { }

  getCurrentView() {
    return this.currentViewSource;
  }

  setCurrentView(val: MainViewsEnum) {
    this.currentViewSource.next(val);
  }

  getCurrentSwapView() {
    return this.innerSwapView;
  }

  setCurrentSwapView(val: SwapViews) {
    this.innerSwapView = val;
  }

}