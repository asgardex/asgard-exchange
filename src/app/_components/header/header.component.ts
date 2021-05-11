import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from 'src/app/_classes/user';
import { UserService } from 'src/app/_services/user.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnDestroy {
  isTestnet: boolean;
  user: User;
  subs: Subscription[];

  constructor(private userService: UserService) {
    this.isTestnet = environment.network === 'testnet' ? true : false;

    const user$ = this.userService.user$.subscribe(
      (user) => (this.user = user)
    );

    this.subs = [user$];
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}
