import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

/** MATERIAL */
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { IconTickerModule } from '../_components/icon-ticker/icon-ticker.module';


/** COMPONENTS */
import { SwapComponent } from './swap.component';
import { ConfirmSwapModalComponent } from './confirm-swap-modal/confirm-swap-modal.component';
import { ConnectComponent, ConnectModal } from './../_components/connect/connect.component';
import { ConnectErrorComponent } from './../_components/connect/connect-error/connect-error.component';
import { KeystoreConnectComponent } from './../_components/connect/keystore-connect/keystore-connect.component';
// import { LedgerConnectComponent } from './../_components/connect/ledger-connect/ledger-connect.component';
import { KeystoreCreateComponent } from './../_components/connect/keystore-create/keystore-create.component';
// import { UserSettingsDialogComponent } from './../_components/user-settings/user-settings-dialog/user-settings-dialog.component';


/** MODULES */
import { AssetInputModule } from '../_components/asset-input/asset-input.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TransactionProcessingModalModule } from '../_components/transaction-processing-modal/transaction-processing-modal.module';
import { TransactionSuccessModalModule } from '../_components/transaction-success-modal/transaction-success-modal.module';
import { TransactionLedgerConfirmModalModule } from '../_components/transaction-ledger-confirm-modal/transaction-ledger-confirm-modal.module';
import { MarketsModalModule } from '../_components/markets-modal/markets-modal.module';
import { from } from 'rxjs';

import { ApproveEthContractModule } from '../_components/approve-eth-contract/approve-eth-contract.module';
import { DirectivesModule } from '../_directives/directives.module';
import { ArrowModule } from '../_components/arrow/arrow.module';

@NgModule({
  declarations: [
    SwapComponent,
    ConfirmSwapModalComponent,
    ConnectComponent,
    ConnectModal,
    KeystoreConnectComponent,
    ConnectErrorComponent,
    // LedgerConnectComponent,
    KeystoreCreateComponent,
    // UserSettingsDialogComponent
  ],
  imports: [
    CommonModule,
    AssetInputModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    IconTickerModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MarketsModalModule,
    TransactionProcessingModalModule,
    TransactionSuccessModalModule,
    TransactionLedgerConfirmModalModule,
    DirectivesModule,
    ApproveEthContractModule,
    ArrowModule,
    RouterModule.forChild([
      {
        path: '',
        component: SwapComponent
      }
    ])
  ],
  entryComponents: [ConfirmSwapModalComponent]
})
export class SwapModule { }
