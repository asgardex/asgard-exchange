import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PoolComponent } from './pool.component';
import { RouterModule } from '@angular/router';
import { StakedPoolsListComponent } from './staked-pools-list/staked-pools-list.component';
import { StakedPoolListItemComponent } from './staked-pool-list-item/staked-pool-list-item.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IconTickerModule } from '../_components/icon-ticker/icon-ticker.module';

@NgModule({
  declarations: [
    PoolComponent,
    StakedPoolsListComponent,
    StakedPoolListItemComponent,
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    IconTickerModule,
    RouterModule.forChild([
      {
        path: '',
        component: PoolComponent,
      },
    ]),
  ],
})
export class PoolModule {}
