import { Component, Output, EventEmitter, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Chain } from '@xchainjs/xchain-util';
import { User } from 'src/app/_classes/user';
import { MockClientService } from 'src/app/_services/mock-client.service';
import { UserService } from 'src/app/_services/user.service';

@Component({
  selector: 'app-update-target-address-modal',
  templateUrl: './update-target-address-modal.component.html',
  styleUrls: ['./update-target-address-modal.component.scss'],
})
export class UpdateTargetAddressModalComponent {
  @Output() back: EventEmitter<null>;
  targetAddress: string;
  user: User;
  chain: Chain;

  constructor(
    private userService: UserService,
    private mockClientService: MockClientService,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      chain: Chain;
      targetAddress: string;
      user: User;
    },
    public dialogRef: MatDialogRef<UpdateTargetAddressModalComponent>
  ) {
    this.user = data?.user ?? null;
    this.chain = data?.chain ?? null;
    this.back = new EventEmitter<null>();
    this.targetAddress = data?.targetAddress ?? '';
  }

  updateAddress() {
    if (
      !this.mockClientService
        .getMockClientByChain(this.chain)
        .validateAddress(this.targetAddress)
    ) {
      return;
    }

    this.dialogRef.close(this.targetAddress);
  }

  formDisabled(): boolean {
    if (!this.user) {
      return true;
    }

    if (
      !this.mockClientService
        .getMockClientByChain(this.chain)
        .validateAddress(this.targetAddress)
    ) {
      return true;
    }

    return false;
  }

  updateAddressBtnText() {
    if (!this.user) {
      return 'No User found';
    }

    if (
      !this.mockClientService
        .getMockClientByChain(this.chain)
        .validateAddress(this.targetAddress)
    ) {
      return `Invalid ${this.chain} Address`;
    }

    return 'Set Address';
  }

  close() {
    this.dialogRef.close();
  }
}
