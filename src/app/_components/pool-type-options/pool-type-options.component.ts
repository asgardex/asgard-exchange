import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Asset } from 'src/app/_classes/asset';
import {
  AvailablePoolTypeOptions,
  PoolTypeOption,
} from 'src/app/_const/pool-type-options';

@Component({
  selector: 'app-pool-type-options',
  templateUrl: './pool-type-options.component.html',
  styleUrls: ['./pool-type-options.component.scss'],
})
export class PoolTypeOptionsComponent {
  @Input() asset: Asset;
  @Input() selectedPoolType: PoolTypeOption;
  @Input() poolTypeOptions: AvailablePoolTypeOptions;
  @Output() selectPoolType: EventEmitter<PoolTypeOption>;

  constructor() {
    this.selectPoolType = new EventEmitter<PoolTypeOption>();
  }
}
