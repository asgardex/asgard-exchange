import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MultiTransfer, TransferResult } from '@thorchain/asgardex-binance';
import { tokenAmount, tokenToBase } from '@thorchain/asgardex-token';
import { Subscription } from 'rxjs';
import { Asset } from 'src/app/_classes/asset';
import { PoolAddressDTO } from 'src/app/_classes/pool-address';
import { User } from 'src/app/_classes/user';
import { TransactionConfirmationState } from 'src/app/_const/transaction-confirmation-state';
import { BinanceService } from 'src/app/_services/binance.service';
import { MidgardService } from 'src/app/_services/midgard.service';
import { UserService } from 'src/app/_services/user.service';
import { WalletConnectService } from 'src/app/_services/wallet-connect.service';
import { environment } from 'src/environments/environment';

export interface ConfirmDepositData {
  asset: Asset;
  rune: Asset;
  assetAmount: number;
  runeAmount: number;
  user: User;
  runeBasePrice: number;
  assetBasePrice: number;
}

@Component({
  selector: 'app-confirm-deposit-modal',
  templateUrl: './confirm-deposit-modal.component.html',
  styleUrls: ['./confirm-deposit-modal.component.scss']
})
export class ConfirmDepositModalComponent implements OnInit, OnDestroy {

  txState: TransactionConfirmationState;
  hash: string;
  subs: Subscription[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDepositData,
    public dialogRef: MatDialogRef<ConfirmDepositModalComponent>,
    private walletConnectService: WalletConnectService,
    private midgardService: MidgardService,
    private userService: UserService,
    private binanceService: BinanceService
  ) {
    this.txState = TransactionConfirmationState.PENDING_CONFIRMATION;
    const user$ = this.userService.user$.subscribe(
      (user) => {
        if (!user) {
          this.closeDialog();
        }
      }
    );

    this.subs = [user$];
  }

  ngOnInit(): void {
  }

  submitTransaction(): void {
    this.txState = TransactionConfirmationState.SUBMITTING;

    this.midgardService.getProxiedPoolAddresses().subscribe(
      async (res) => {

        const currentPools = res.current;

        if (currentPools && currentPools.length > 0) {

          const matchingPool = currentPools.find( (pool) => pool.chain === 'BNB' );

          const outputs: MultiTransfer[] = [
            {
              to: matchingPool.address,
              coins: [
                {
                  denom: this.data.rune.symbol,
                  amount: (this.data.user.type === 'keystore')
                    ? this.data.runeAmount
                    : tokenToBase(tokenAmount(this.data.runeAmount))
                      .amount()
                      .toNumber(),
                },
                {
                  denom: this.data.asset.symbol,
                  amount: (this.data.user.type === 'keystore')
                    ? this.data.assetAmount
                    : tokenToBase(tokenAmount(this.data.assetAmount))
                      .amount()
                      .toNumber(),
                },
              ],
            },
          ];

          const memo = `STAKE:BNB.${this.data.asset.symbol}`;

          if (matchingPool) {
            if (this.data.user.type === 'keystore') {
              this.keystoreTransaction(outputs, memo);
            } else if (this.data.user.type === 'walletconnect') {
              this.walletConnectTransaction(outputs, memo, matchingPool);
            }
          }

        }

      }
    );
  }

  async keystoreTransaction(outputs: MultiTransfer[], memo: string) {

    const bncClient = this.binanceService.bncClient;
    await bncClient.initChain();

    bncClient
      .multiSend(this.data.user.wallet, outputs, memo)
      .then((response: TransferResult) => {

        this.txState = TransactionConfirmationState.SUCCESS;

        if (response.result && response.result.length > 0) {
          this.hash = response.result[0].hash;
          this.userService.setPendingTransaction(this.hash);
        }
      })
      .catch((error: Error) => {
        console.error('error making transfer: ', error);
        this.txState = TransactionConfirmationState.ERROR;
      });
  }

  walletConnectTransaction(outputs: MultiTransfer[], memo: string, matchingPool: PoolAddressDTO) {

    const sendOrder = this.walletConnectService.walletConnectGetSendOrderMsg({
      fromAddress: this.data.user.wallet,
      toAddress: matchingPool.address,
      coins: outputs[0].coins
    });

    const bncClient = this.binanceService.bncClient;

    /**
     * TODO: clean up, this is used in confirm-swap-modal as well
     */
    bncClient
      .getAccount(this.data.user.wallet)
      .then(async (response) => {
        if (!response) {
          console.error('error getting response from getAccount');
          return;
        }

        const account = response.result;
        const chainId = environment.network === 'testnet' ? 'Binance-Chain-Nile' : 'Binance-Chain-Tigris';
        const tx = {
          accountNumber: account.account_number.toString(),
          sequence: account.sequence.toString(),
          send_order: sendOrder,
          chainId,
          memo,
        };

        const res = await this.walletConnectService.walletConnectSendTx(tx, bncClient);

        if (res) {
          this.txState = TransactionConfirmationState.SUCCESS;

          if (res.result && res.result.length > 0) {
            this.hash = res.result[0].hash;
            this.userService.setPendingTransaction(this.hash);
          }
        }

    })
    .catch((error) => {
      console.error('getAccount error: ', error);
    });
  }

  closeDialog(transactionSucess?: boolean) {
    this.dialogRef.close(transactionSucess);
  }

  ngOnDestroy() {
    for (const sub of this.subs) {
      sub.unsubscribe();
    }
  }


}
