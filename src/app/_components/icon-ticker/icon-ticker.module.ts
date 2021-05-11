import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconTickerComponent } from './icon-ticker.component';
import { MatIconModule } from '@angular/material/icon';
import { DirectivesModule } from 'src/app/_directives/directives.module';

@NgModule({
  declarations: [IconTickerComponent],
  imports: [CommonModule, MatIconModule, DirectivesModule],
  exports: [IconTickerComponent],
})
export class IconTickerModule {}
