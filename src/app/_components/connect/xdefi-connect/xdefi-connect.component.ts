import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import { UserService } from "src/app/_services/user.service";
import { XDEFIService } from "src/app/_services/xdefi.service";

@Component({
  selector: "app-xdefi-connect",
  templateUrl: "./xdefi-connect.component.html",
  styleUrls: ["./xdefi-connect.component.scss"],
})
export class XDEFIConnectComponent implements OnInit {
  xdefiPassword: string;
  xdefiFile: File;
  xdefiFileSelected: boolean;
  xdefi;
  xdefiConnecting: boolean;
  xdefiError: boolean;
  @Output() back: EventEmitter<null>;
  @Output() closeModal: EventEmitter<null>;

  constructor(
    private userService: UserService,
    private xdefiService: XDEFIService
  ) {
    this.back = new EventEmitter<null>();
    this.closeModal = new EventEmitter<null>();
  }

  ngOnInit(): void {}

  clearKeystore() {
    this.xdefiPassword = "";
    this.xdefiFile = null;
    this.xdefiFileSelected = false;
    this.back.emit();
  }

  async initUnlock() {
    if (this.xdefiConnecting) {
      return;
    }

    this.xdefiConnecting = true;

    setTimeout(() => {
      this.xdefiConnect();
    }, 100);
  }

  async xdefiConnect() {
    this.xdefiError = false;

    try {
      const user = await this.xdefiService.connectXDEFI();
      this.userService.setUser(user);
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
