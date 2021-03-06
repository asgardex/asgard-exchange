import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, SimpleChange } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from 'src/app/_classes/user';
import { OverlaysService } from 'src/app/_services/overlays.service';
import { UserService } from 'src/app/_services/user.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {

  isTestnet: boolean;
  user: User;
  subs: Subscription[];

  private _overlay: boolean;
  get overlay(): boolean {
    return this._overlay;
  }
  @Input() set overlay(value: boolean) {
    this._overlay = value;
    this.overlayChange.emit(value);
  }
  @Output() overlayChange = new EventEmitter<boolean>();

  constructor(private userService: UserService, public overlaysService: OverlaysService) {
    this.isTestnet = environment.network === 'testnet' ? true : false;

    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );

    this.subs = [user$];

  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChange) {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to = JSON.stringify(changedProp.currentValue);
      console.log(to)
    }
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
