import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

/** COMPONENTS */
import { AppComponent } from './app.component';
import { HeaderComponent } from './_components/header/header.component';
import { ConnectComponent, ConnectModal } from './_components/connect/connect.component';
import { KeystoreConnectComponent } from './_components/connect/keystore-connect/keystore-connect.component';

/** MODULES */
import { AppRoutingModule } from './app-routing.module';

/** SERVICES */
import { BinanceService } from './_services/binance.service';
import { LastBlockService } from './_services/last-block.service';
import { MidgardService } from './_services/midgard.service';
import { UserService } from './_services/user.service';
import { WalletConnectService } from './_services/wallet-connect.service';

/** MATERIAL */
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ConnectErrorComponent } from './_components/connect/connect-error/connect-error.component';
import { LastBlockIndicatorComponent } from './_components/last-block-indicator/last-block-indicator.component';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    ConnectComponent,
    ConnectModal,
    KeystoreConnectComponent,
    ConnectErrorComponent,
    LastBlockIndicatorComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    AppRoutingModule,
  ],
  providers: [BinanceService, UserService, MidgardService, LastBlockService, WalletConnectService],
  bootstrap: [AppComponent]
})
export class AppModule { }
