import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Asset as xchainAsset, baseAmount, bn } from '@xchainjs/xchain-util';
import { ethers } from 'ethers';
import { Subscription, combineLatest } from 'rxjs';
import { Asset } from 'src/app/_classes/asset';
import { User } from 'src/app/_classes/user';
import { EthUtilsService } from 'src/app/_services/eth-utils.service';
import { MetamaskService } from 'src/app/_services/metamask.service';
import { TransactionStatusService } from 'src/app/_services/transaction-status.service';
import { UserService } from 'src/app/_services/user.service';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import { MidgardService } from 'src/app/_services/midgard.service';

export type ApproveEthContractModalParams = {
  routerAddress: string;
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
  metaMaskProvider?: ethers.providers.Web3Provider;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ApproveEthContractModalParams,
    public dialogRef: MatDialogRef<ApproveEthContractModalComponent>,
    private userService: UserService,
    private txStatusService: TransactionStatusService,
    private ethUtilService: EthUtilsService,
    private metaMaskService: MetamaskService,
    private midgardService: MidgardService
  ) {
    this.loading = true;
    this.insufficientEthBalance = false;
    this.subs = [];
  }

  ngOnInit(): void {
    const user$ = this.userService.user$;
    const balances$ = this.userService.userBalances$;
    const metaMaskProvider$ = this.metaMaskService.provider$;

    const combined = combineLatest([user$, balances$, metaMaskProvider$]);

    const sub = combined.subscribe(([user, balances, metaMaskProvider]) => {
      this.user = user;
      this.ethBalance = this.userService.findBalance(
        balances,
        new Asset('ETH.ETH')
      );
      this.metaMaskProvider = metaMaskProvider;

      this.loading = false;
    });

    this.subs.push(sub);
  }

  async approve() {
    this.loading = true;

    if (this.data.routerAddress && this.user && this.data.asset) {
      const asset = this.data.asset;
      const routerContractAddress = this.data.routerAddress;

      const assetAddress = asset.symbol.slice(asset.ticker.length + 1);
      const strip0x = assetAddress.substr(2);
      let approve: TransactionResponse;

      try {
        if (this.user.type === 'keystore') {
          const inboundAddresses = await this.midgardService
            .getInboundAddresses()
            .toPromise();
          const ethInbound = inboundAddresses.find(
            (inbound) => inbound.chain === 'ETH'
          );
          if (!ethInbound) {
            return;
          }

          const ethClient = this.user.clients.ethereum;

          const keystoreProvider = this.user.clients.ethereum.getProvider();
          approve = await this.ethUtilService.approveKeystore({
            contractAddress: strip0x,
            routerContractAddress,
            provider: keystoreProvider,
            ethClient,
            ethInbound,
            userAddress: ethClient.getAddress(),
          });
        } else if (this.user.type === 'XDEFI') {
          approve = await this.ethUtilService.approveXDEFI({
            ethClient: this.user.clients.ethereum,
            contractAddress: strip0x,
            spenderAddress: routerContractAddress,
          });
        } else if (this.user.type === 'metamask') {
          approve = await this.ethUtilService.approveMetaMask({
            contractAddress: strip0x,
            routerContractAddress,
            provider: this.metaMaskProvider,
          });
        }
        this.txStatusService.pollEthContractApproval(approve.hash);
        this.dialogRef.close(approve.hash);
      } catch (error) {
        console.log('error is: ', error);
        this.loading = false;
      }
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
