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
import { UserService } from './_services/user.service';
import { MidgardService } from './_services/midgard.service';
import { WalletService } from './_services/wallet.service';

/** MATERIAL */
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WalletConnectComponent } from './_components/connect/wallet-connect/wallet-connect.component';
import { ConnectErrorComponent } from './_components/connect/connect-error/connect-error.component';


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    ConnectComponent,
    ConnectModal,
    KeystoreConnectComponent,
    WalletConnectComponent,
    ConnectErrorComponent,
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
  providers: [BinanceService, UserService, MidgardService, WalletService],
  bootstrap: [AppComponent]
})
export class AppModule { }
