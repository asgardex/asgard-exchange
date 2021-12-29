import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssetsListComponent } from './assets-list.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DirectivesModule } from 'src/app/_directives/directives.module';
import { FormsModule } from '@angular/forms';
import { AssetsListGroupSelectComponent } from './assets-list-group-select/assets-list-group-select.component';

@NgModule({
  declarations: [AssetsListComponent, AssetsListGroupSelectComponent],
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    DirectivesModule,
    FormsModule,
  ],
  exports: [AssetsListComponent],
})
export class AssetsListModule {}
