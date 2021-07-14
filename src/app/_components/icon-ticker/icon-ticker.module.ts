import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconTickerComponent } from './icon-ticker.component';
import { MatIconModule } from '@angular/material/icon';
import { DirectivesModule } from 'src/app/_directives/directives.module';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  declarations: [IconTickerComponent],
  imports: [CommonModule, MatIconModule, DirectivesModule, MatTooltipModule],
  exports: [IconTickerComponent],
})
export class IconTickerModule {}
