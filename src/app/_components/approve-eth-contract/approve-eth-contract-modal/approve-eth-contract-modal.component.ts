import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Asset as xchainAsset, baseAmount, bn } from '@xchainjs/xchain-util';
import { Subscription, combineLatest } from 'rxjs';
import { Asset } from 'src/app/_classes/asset';
import { User } from 'src/app/_classes/user';
import { TransactionStatusService } from 'src/app/_services/transaction-status.service';
import { UserService } from 'src/app/_services/user.service';

export type ApproveEthContractModalParams = {
  contractAddress: string;
  asset: xchainAsset;
};

@Component({
  selector: 'app-approve-eth-contract-modal',
  templateUrl: './approve-eth-contract-modal.component.html',
  styleUrls: ['./approve-eth-contract-modal.component.scss'],
})
export class ApproveEthContractModalComponent implements OnInit, OnDestroy {
  user: User;
  subs: Subscription[];
  loading: boolean;
  fee: string;
  ethBalance: number;
  insufficientEthBalance: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ApproveEthContractModalParams,
    public dialogRef: MatDialogRef<ApproveEthContractModalComponent>,
    private userService: UserService,
    private txStatusService: TransactionStatusService
  ) {
    this.loading = true;
    this.insufficientEthBalance = false;
    this.subs = [];
  }

  ngOnInit(): void {
    const user$ = this.userService.user$;
    const balances$ = this.userService.userBalances$;

    const combined = combineLatest([user$, balances$]);

    const sub = combined.subscribe(([user, balances]) => {
      this.user = user;
      this.ethBalance = this.userService.findBalance(
        balances,
        new Asset('ETH.ETH')
      );

      this.loading = false;
    });

    this.subs.push(sub);
  }

  async approve() {
    this.loading = true;

    if (this.data.contractAddress && this.user && this.data.asset) {
      const asset = this.data.asset;
      const contractAddress = this.data.contractAddress;

      const assetAddress = asset.symbol.slice(asset.ticker.length + 1);
      const strip0x = assetAddress.substr(2);
      const approve = await this.user.clients.ethereum.approve({
        walletIndex: 0,
        spender: contractAddress,
        sender: strip0x,
        amount: baseAmount(bn(2).pow(96).minus(1)),
        feeOptionKey: 'fast',
      });

      this.txStatusService.pollEthContractApproval(approve.hash);
      this.dialogRef.close(approve.hash);
    }

    this.loading = false;
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }
}
