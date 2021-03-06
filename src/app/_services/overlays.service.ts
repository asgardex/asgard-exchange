import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OverlaysService {

  private currentView: 'Reconnect' | 'User Setting' | 'Swap';
  private innerSwapView: 'Swap' | 'TargetAsset' | 'SourceAsset' | 'Connect' | 'Confirm';

  constructor() { }

  getCurrentView() {
    return this.currentView;
  }

  setCurrentView(val: 'Reconnect' | 'User Setting' | 'Swap') {
    this.currentView = val;
  }

  getCurrentSwapView() {
    return this.innerSwapView;
  }

  setCurrentSwapView(val: 'Swap' | 'TargetAsset' | 'SourceAsset' | 'Connect' | 'Confirm') {
    this.innerSwapView = val;
  }

}
