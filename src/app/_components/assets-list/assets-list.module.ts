import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetsListComponent } from './assets-list.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';



@NgModule({
  declarations: [AssetsListComponent],
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule
  ],
  exports: [AssetsListComponent]
})
export class AssetsListModule { }
