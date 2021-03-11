import { Component, Input, OnDestroy, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Asset } from '@xchainjs/xchain-util';
import { Subscription } from 'rxjs';
import { User } from 'src/app/_classes/user';
import { TransactionStatusService } from 'src/app/_services/transaction-status.service';
import { UserService } from 'src/app/_services/user.service';
import { ApproveEthContractModalComponent } from './approve-eth-contract-modal/approve-eth-contract-modal.component';

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

  constructor(private userService: UserService, private txStatusService: TransactionStatusService, private dialog: MatDialog) {

    this.approved = new EventEmitter<null>();
    this.approving = false;

    const user$ = this.userService.user$.subscribe(
      (user) => this.user = user
    );

    const ethContractApproval$ = this.txStatusService.ethContractApproval$.subscribe(
      (hash) => {
        if (hash === this.isApprovedTxHash) {
          this.approved.emit();
        }
      }
    );

    this.subs = [user$, ethContractApproval$];
  }

  ngOnInit(): void {
  }

  openConfirmationDialog() {
    const dialogRef = this.dialog.open(
      ApproveEthContractModalComponent,
      {
        minWidth: '260px',
        maxWidth: '420px',
        width: '50vw',
        data: {
          contractAddress: this.contractAddress,
          asset: this.asset
        }
      }
    );

    dialogRef.afterClosed().subscribe( (isApprovedTxHash: string) => {

      if (isApprovedTxHash) {
        this.isApprovedTxHash = isApprovedTxHash;
        this.approving = true;
      }

    });
  }

  ngOnDestroy(): void {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }

}
