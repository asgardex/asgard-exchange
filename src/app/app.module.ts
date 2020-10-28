import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

/** COMPONENTS */
import { AppComponent } from './app.component';
import { ConnectComponent, ConnectModal } from './_components/connect/connect.component';
import { ConnectErrorComponent } from './_components/connect/connect-error/connect-error.component';
import { HeaderComponent } from './_components/header/header.component';
import { KeystoreConnectComponent } from './_components/connect/keystore-connect/keystore-connect.component';
import { LastBlockIndicatorComponent } from './_components/last-block-indicator/last-block-indicator.component';
import { LedgerConnectComponent } from './_components/connect/ledger-connect/ledger-connect.component';
import { KeystoreCreateComponent } from './_components/connect/keystore-create/keystore-create.component';
import { UserSettingsComponent } from './_components/connect/user-settings/user-settings.component';
import { PendingTxsModalComponent } from './_components/pending-txs-modal/pending-txs-modal.component';

/** MODULES */
import { AppRoutingModule } from './app-routing.module';

/** SERVICES */
import { BinanceService } from './_services/binance.service';
import { BlockchairService } from './_services/blockchair.service';
import { ExplorerPathsService } from './_services/explorer-paths.service';
import { LastBlockService } from './_services/last-block.service';
import { MidgardService } from './_services/midgard.service';
import { UserService } from './_services/user.service';
import { TransactionStatusService } from './_services/transaction-status.service';
import { WalletConnectService } from './_services/wallet-connect.service';

/** MATERIAL */
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    ConnectComponent,
    ConnectModal,
    KeystoreConnectComponent,
    ConnectErrorComponent,
    LastBlockIndicatorComponent,
    LedgerConnectComponent,
    KeystoreCreateComponent,
    UserSettingsComponent,
    PendingTxsModalComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    AppRoutingModule,
  ],
  providers: [
    BinanceService,
    BlockchairService,
    UserService,
    MidgardService,
    LastBlockService,
    WalletConnectService,
    ExplorerPathsService,
    TransactionStatusService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
