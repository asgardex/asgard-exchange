import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { assetAmount, assetToBase, baseAmount, getPoolShare, getValueOfAssetInRune, getValueOfRuneInAsset, PoolData, UnitData } from '@thorchain/asgardex-util';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Asset } from '../_classes/asset';
import { StakerPoolData } from '../_classes/staker-pool-data';
import { User } from '../_classes/user';
import { MidgardService } from '../_services/midgard.service';
import { UserService } from '../_services/user.service';
import { ConfirmUnstakeModalComponent } from './confirm-unstake-modal/confirm-unstake-modal.component';

@Component({
  selector: 'app-unstake',
  templateUrl: './unstake.component.html',
  styleUrls: ['./unstake.component.scss']
})
export class UnstakeComponent implements OnInit {

  runeSymbol = environment.network === 'chaosnet' ? 'RUNE-B1A' : 'RUNE-67C';

  get unstakePercent() {
    return this._unstakePercent;
  }
  set unstakePercent(val: number) {
    this._unstakePercent = val;
    this.calculate();
  }
  _unstakePercent: number;

  subs: Subscription[];
  asset: Asset;
  rune: Asset;
  assetPoolData: PoolData;
  poolUnits: number;
  user: User;
  stakedPool: StakerPoolData;

  removeRuneAmount: number;
  removeAssetAmount: number;

  runeBasePrice: number;
  assetBasePrice: number;

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private userService: UserService,
    private midgardService: MidgardService
  ) {

    this.rune = new Asset(this.runeSymbol);

    this.unstakePercent = 0;

    const user$ = this.userService.user$.subscribe(
      (user) => {
        console.log('user HIT');
        this.user = user;
        this.getAccountStaked();
        if (this.assetPoolData) {
          this.getPoolDetail(this.asset.chain + '.' + this.asset.symbol);
        }
      }
    );

    this.subs = [user$];
  }

  ngOnInit(): void {

    const params$ = this.route.paramMap.subscribe( (params) => {

      const asset = params.get('asset');

      if (asset) {

        this.asset = new Asset(asset);
        console.log('the asset is: ', this.asset);
        this.getPoolDetail(asset);
        this.getAccountStaked();

      }

    });

    this.subs.push(params$);

  }

  getAccountStaked() {

    if (this.user && this.asset) {

      this.midgardService.getStakerPoolData(this.user.wallet, [`${this.asset.chain}.${this.asset.symbol}`]).subscribe(
        (res) => {
          if (res && res.length > 0) {
            // this.stakedPool = res.map( (dto) => new StakerPoolData(dto) );
            this.stakedPool = new StakerPoolData(res[0]);
          }

        },
        (err) => console.error('error fetching pool staker data: ', err)
      );

    }

  }

  calculate() {

    if (this.stakedPool && this.poolUnits) {

      const unitData: UnitData = {
        stakeUnits: baseAmount(this.stakedPool.stakeUnits),
        totalUnits: baseAmount(this.poolUnits)
      };

      const poolShare = getPoolShare(unitData, this.assetPoolData);

      this.removeRuneAmount = poolShare.rune.amount().div(10 ** 8 ).multipliedBy(this.unstakePercent / 100).toNumber();
      this.removeAssetAmount = poolShare.asset.amount().div(10 ** 8 ).multipliedBy(this.unstakePercent / 100).toNumber();

      // this.poolShare = Number(this.stakedPool.stakeUnits) / Number(this.poolData.poolUnits);
    }

  }

  openConfirmationDialog() {

    const runeBasePrice = getValueOfAssetInRune(assetToBase(assetAmount(1)), this.assetPoolData).amount().div(10 ** 8).toNumber();
    const assetBasePrice = getValueOfRuneInAsset(assetToBase(assetAmount(1)), this.assetPoolData).amount().div(10 ** 8).toNumber();

    const dialogRef = this.dialog.open(
      ConfirmUnstakeModalComponent,
      {
        width: '50vw',
        maxWidth: '420px',
        data: {
          asset: this.asset,
          rune: this.rune,
          assetAmount: this.removeAssetAmount,
          runeAmount: this.removeRuneAmount,
          user: this.user,
          unstakePercent: this.unstakePercent,
          runeBasePrice,
          assetBasePrice
        }
      }
    );

    dialogRef.afterClosed().subscribe( (transactionSuccess: boolean) => {

      if (transactionSuccess) {
        this.unstakePercent = 0;
      }

    });
  }

  getPoolDetail(asset: string) {
    this.midgardService.getPoolDetails([asset]).subscribe(
      (res) => {

        if (res && res.length > 0) {

          this.assetPoolData = {
            assetBalance: baseAmount(res[0].assetDepth),
            runeBalance: baseAmount(res[0].runeDepth),
          };
          this.poolUnits = +res[0].poolUnits;

          this.runeBasePrice = getValueOfAssetInRune(assetToBase(assetAmount(1)), this.assetPoolData).amount().div(10 ** 8).toNumber();
          this.assetBasePrice = getValueOfRuneInAsset(assetToBase(assetAmount(1)), this.assetPoolData).amount().div(10 ** 8).toNumber();

          this.calculate();

        }
      },
      (err) => console.error('error getting pool detail: ', err)
    );
  }

}
