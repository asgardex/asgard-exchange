import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

/** MATERIAL */
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/** COMPONENTS */
import { SwapComponent } from './swap.component';
import { ConfirmSwapModalComponent } from './confirm-swap-modal/confirm-swap-modal.component';

/** MODULES */
import { AssetInputModule } from '../_components/asset-input/asset-input.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TransactionProcessingModalModule } from '../_components/transaction-processing-modal/transaction-processing-modal.module';
import { TransactionSuccessModalModule } from '../_components/transaction-success-modal/transaction-success-modal.module';
import { TransactionLedgerConfirmModalModule } from '../_components/transaction-ledger-confirm-modal/transaction-ledger-confirm-modal.module';
import { ApproveEthContractModule } from '../_components/approve-eth-contract/approve-eth-contract.module';
import { DirectivesModule } from '../_directives/directives.module';
import { UpdateTargetAddressModalComponent } from './update-target-address-modal/update-target-address-modal.component';
import { ModalSectionHeaderModule } from '../_components/modal-section-header/modal-section-header.module';

@NgModule({
  declarations: [
    SwapComponent,
    ConfirmSwapModalComponent,
    UpdateTargetAddressModalComponent,
  ],
  imports: [
    CommonModule,
    AssetInputModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TransactionProcessingModalModule,
    TransactionSuccessModalModule,
    TransactionLedgerConfirmModalModule,
    DirectivesModule,
    ApproveEthContractModule,
    ModalSectionHeaderModule,
    RouterModule.forChild([
      {
        path: '',
        redirectTo: 'THOR.RUNE/BTC.BTC',
      },
      {
        path: ':inputAsset',
        component: SwapComponent,
      },
      {
        path: ':inputAsset/:outputAsset',
        component: SwapComponent,
      },
    ]),
  ],
  entryComponents: [ConfirmSwapModalComponent],
})
export class SwapModule {}
