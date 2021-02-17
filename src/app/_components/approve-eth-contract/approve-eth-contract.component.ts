import { Component, Input, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { Asset, baseAmount } from '@xchainjs/xchain-util';
import { Subscription } from 'rxjs';
import { User } from 'src/app/_classes/user';
import { TransactionStatusService } from 'src/app/_services/transaction-status.service';
import { UserService } from 'src/app/_services/user.service';

@Component({
  selector: 'app-approve-eth-contract',
  templateUrl: './approve-eth-contract.component.html',
  styleUrls: ['./approve-eth-contract.component.scss']
})
export class ApproveEthContractComponent implements OnInit, OnDestroy {

  @Input() contractAddress: string;
  @Input() asset: Asset;
  @Output() approved: EventEmitter<null>;

  user: User;
  subs: Subscription[];
  isApprovedTxHash: string;
  approving: boolean;

  constructor(private userService: UserService, private txStatusService: TransactionStatusService) {

    this.approved = new EventEmitter<null>();
    this.approving = false;

    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );

    const ethContractApproval$ = this.txStatusService.ethContractApproval$.subscribe(
      (hash) => {
        if (hash === this.isApprovedTxHash) {
          console.log('approve eth contract CONTRACT APPROVED match. emitting...');
          this.approved.emit();
        }
      }
    );

    this.subs = [user$, ethContractApproval$];
  }

  ngOnInit(): void {
  }

  async approve() {
    console.log('approve clicked');

    if (this.contractAddress && this.user && this.asset) {

      const assetAddress = this.asset.symbol.slice(this.asset.ticker.length + 1);
      const strip0x = assetAddress.substr(2);
      console.log('approving strip0x: ', strip0x);
      console.log('approving contract address: ', this.contractAddress);
      const approve = await this.user.clients.ethereum.approve(this.contractAddress, strip0x);

      console.log('is approved is: ', approve);
      this.isApprovedTxHash = approve.hash;

      this.txStatusService.pollEthContractApproval(approve.hash);
      this.approving = true;

    }

  }

  ngOnDestroy(): void {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
