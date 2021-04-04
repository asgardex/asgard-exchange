import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserService } from 'src/app/_services/user.service';
import { XDEFIService } from 'src/app/_services/xdefi.service';

@Component({
  selector: 'app-xdefi-connect',
  templateUrl: './xdefi-connect.component.html',
  styleUrls: ['./xdefi-connect.component.scss'],
})
export class XDEFIConnectComponent implements OnInit {
  xdefi;
  xdefiConnecting: boolean;
  xdefiError: boolean;
  listProviders: typeof XDEFIService.listProvider;
  isValidNetwork: boolean;
  @Output() back: EventEmitter<null>;
  @Output() closeModal: EventEmitter<null>;

  constructor(
    private userService: UserService,
    private xdefiService: XDEFIService
  ) {
    this.back = new EventEmitter<null>();
    this.closeModal = new EventEmitter<null>();
  }

  ngOnInit(): void {
    this.listProviders = this.xdefiService.listEnabledXDFIProviders();
    this.isValidNetwork = this.xdefiService.isValidNetwork();
  }

  async initUnlock() {
    if (this.xdefiConnecting) {
      return;
    }
    setTimeout(() => {
      this.xdefiConnect();
    }, 100);
  }

  async xdefiConnect() {
    this.xdefiError = false;
    this.xdefiConnecting = true;
    try {
      const user = await this.xdefiService.connectXDEFI();
      this.userService.setUser(user);
      localStorage.setItem('XDEFI_CONNECTED', 'true');
    } catch (error) {
      this.xdefiConnecting = false;
      this.xdefiError = true;
      console.error(error);
    }
  }

  backClicked() {
    this.back.emit();
  }
}
