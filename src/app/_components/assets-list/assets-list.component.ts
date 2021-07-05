import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Chain } from '@xchainjs/xchain-util';
import { Asset, getAssetIconPath } from 'src/app/_classes/asset';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';

@Component({
  selector: 'app-assets-list',
  templateUrl: './assets-list.component.html',
  styleUrls: ['./assets-list.component.scss'],
})
export class AssetsListComponent implements OnInit {
  @Input() loading: boolean;
  @Input() assetListItems: AssetAndBalance[];
  @Input() disabledAssetSymbol: string;
  @Input() displayAddTokenButton: boolean;
  @Output() selectAsset: EventEmitter<Asset>;
  @Output() addToken: EventEmitter<null>;
  groupedAssets: {
    [key: string]: AssetAndBalance[];
  } = {};
  iconPaths: {
    [key: string]: string;
  } = {};

  selectedGroup: AssetAndBalance[];
  filteredGroup: AssetAndBalance[];
  selectedChain?: string;

  get searchTerm(): string {
    return this._searchTerm;
  }
  set searchTerm(term: string) {
    this._searchTerm = term;

    if (term && term.length > 0) {
      this.filteredGroup = this.selectedGroup.filter((item) => {
        const search = term.toUpperCase();
        return item.asset.symbol.toUpperCase().includes(search);
      });
    } else {
      this.filteredGroup = this.selectedGroup;
    }
  }
  _searchTerm: string;

  constructor() {
    this.selectAsset = new EventEmitter<Asset>();
    this.addToken = new EventEmitter<null>();
  }

  ngOnInit(): void {
    this.groupedAssets = this.assetListItems.reduce(
      (groups, assetAndBalance) => {
        if (!groups[assetAndBalance.asset.chain]) {
          groups[assetAndBalance.asset.chain] = [assetAndBalance];
        } else {
          groups[assetAndBalance.asset.chain].push(assetAndBalance);
        }

        // set icon path
        if (!this.iconPaths[assetAndBalance.asset.chain]) {
          const chain = assetAndBalance.asset.chain;
          this.iconPaths[assetAndBalance.asset.chain] = getAssetIconPath({
            chain,
            ticker: chain,
            symbol: chain,
          });
        }

        return groups;
      },
      {}
    );

    this.iconPaths = Object.keys(this.groupedAssets).reduce(
      (iconPaths, key) => {
        iconPaths[key] = getAssetIconPath({
          chain: key,
          ticker: key,
          symbol: key,
        });
        return iconPaths;
      },
      {}
    );

    if (this.groupedAssets['THOR']) {
      this.selectedGroup = this.groupedAssets['THOR'];
      this.selectedChain = 'THOR';
    } else if (this.groupedAssets['BTC']) {
      this.selectedGroup = this.groupedAssets['BTC'];
      this.selectedChain = 'BTC';
    } else if (this.groupedAssets['ETH']) {
      this.selectedGroup = this.groupedAssets['ETH'];
      this.selectedChain = 'ETH';
    } else {
      // otherwise select the first key or return empty array
      const firstKey = Object.keys(this.groupedAssets)[0];
      this.selectedGroup = firstKey ? this.groupedAssets[firstKey] : [];
      this.selectedChain = firstKey ?? '';
    }

    this.filteredGroup = this.selectedGroup;
  }

  selectGroup(key: Chain) {
    this.selectedGroup = this.groupedAssets[key] ?? [];
    this.selectedChain = key;
    this.searchTerm = '';
    this.filteredGroup = this.selectedGroup;
  }
}
