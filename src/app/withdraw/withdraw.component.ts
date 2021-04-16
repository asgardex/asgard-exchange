import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { getPoolShare, getValueOfAssetInRune, getValueOfRuneInAsset, PoolData, UnitData } from '@thorchain/asgardex-util';
import {
  baseAmount,
  assetToBase,
  assetAmount,
  bn,
} from '@xchainjs/xchain-util';
import { Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Asset } from '../_classes/asset';
import { MemberPool } from '../_classes/member';
import { User } from '../_classes/user';
import { LastBlockService } from '../_services/last-block.service';
import { MidgardService } from '../_services/midgard.service';
import { TransactionUtilsService } from '../_services/transaction-utils.service';
import { UserService } from '../_services/user.service';
import { ConfirmWithdrawModalComponent } from './confirm-withdraw-modal/confirm-withdraw-modal.component';

@Component({
  selector: 'app-withdraw',
  templateUrl: './withdraw.component.html',
  styleUrls: ['./withdraw.component.scss']
})
export class WithdrawComponent implements OnInit {

  runeSymbol = environment.network === 'chaosnet' ? 'RUNE-B1A' : 'RUNE-67C';

  get withdrawPercent() {
    return this._withdrawPercent;
  }
  set withdrawPercent(val: number) {
    this._withdrawPercent = val;
    this.calculate();
  }
  _withdrawPercent: number;

  subs: Subscription[];
  asset: Asset;
  rune: Asset;
  assetPoolData: PoolData;
  poolUnits: number;
  user: User;
  memberPool: MemberPool;

  // checking for cooloff for withdraw
  lastBlock: number;
  lockBlocks: number;
  heightLastStaked: number;
  remainingTime: string;

  removeRuneAmount: number;
  removeAssetAmount: number;

  runeBasePrice: number;
  assetBasePrice: number;

  insufficientBnb: boolean;
  outboundTransactionFee: number;

  networkFee: number;

  constructor(
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private userService: UserService,
    private lastBlockService: LastBlockService,
    private midgardService: MidgardService,
    private router: Router,
    private txUtilsService: TransactionUtilsService
  ) {

    this.rune = new Asset(this.runeSymbol);

    this.withdrawPercent = 0;

    const user$ = this.userService.user$.subscribe(
      (user) => {
        this.user = user;
        this.getAccountStaked();
        if (this.assetPoolData) {
          this.getPoolDetail(this.asset.chain + '.' + this.asset.symbol);
        }
      }
    );

    const balances$ = this.userService.userBalances$.subscribe(
      (balances) => {
        // allows us to ensure enough bnb balance
        const bnbBalance = this.userService.findBalance(balances, new Asset('BNB.BNB'));
        this.insufficientBnb = bnbBalance < 0.000375;
      }
    );

    const lastBlock$ = this.lastBlockService.lastBlock$.subscribe( (block) => {
      this.lastBlock = block;
      this.checkCooldown();
    });

    this.subs = [user$, lastBlock$, balances$];
  }

  ngOnInit(): void {

    this.getConstants();

    const params$ = this.route.paramMap.subscribe( (params) => {

      const asset = params.get('asset');

      if (asset) {

        this.asset = new Asset(asset);

        this.getPoolDetail(asset);
        this.getAccountStaked();

      }

    });

    this.subs.push(params$);

  }

  async getAccountStaked() {

    if (this.user && this.asset) {

      const thorclient = this.user.clients.thorchain;
      if (!thorclient) {
        console.error('no thorclient found');
        return;
      }
      const address = await thorclient.getAddress();

      this.midgardService.getMember(address).subscribe(
        (res) => this.memberPool = res.pools.find( (pool) => pool.pool === `${this.asset.chain}.${this.asset.symbol}` ),
        (err) => console.error('error fetching pool staker data: ', err)
      );

    }

  }

  calculate() {

    if (this.memberPool && this.poolUnits) {

      const unitData: UnitData = {
        stakeUnits: baseAmount(this.memberPool.liquidityUnits),
        totalUnits: baseAmount(this.poolUnits)
      };

      const poolShare = getPoolShare(unitData, this.assetPoolData);

      const runeAmountAfterFee = poolShare.rune.amount().div(10 ** 8 ).multipliedBy(this.withdrawPercent / 100).minus(1).toNumber();
      this.removeRuneAmount = (runeAmountAfterFee <= 0) ? 0 : runeAmountAfterFee;

      const assetAmountAfterFee = poolShare.asset.amount()
        .div(10 ** 8 ).multipliedBy(this.withdrawPercent / 100).minus(this.assetBasePrice).toNumber();
      this.removeAssetAmount = (assetAmountAfterFee <= 0) ? 0 : assetAmountAfterFee;

    }

  }

  getConstants() {
    this.midgardService.getConstants().subscribe(
      (res) => {
        this.lockBlocks = res.int_64_values.LiquidityLockUpBlocks;
        this.outboundTransactionFee = bn(res.int_64_values.OutboundTransactionFee).div(10 ** 8).toNumber();
        this.checkCooldown();
      },
      (err) => console.error('error fetching constants: ', err)
    );
  }

  checkCooldown() {

    if (this.heightLastStaked && this.lastBlock && this.lockBlocks) {

      const heightLastStaked = this.heightLastStaked;
      const currentBlockHeight = this.lastBlock;
      const stakeLockUpBlocks = this.lockBlocks;
      const totalBlocksToUnlock = heightLastStaked + stakeLockUpBlocks;
      const remainingBlocks = totalBlocksToUnlock - currentBlockHeight;
      const withdrawDisabled = remainingBlocks > 0;

      if (withdrawDisabled) {
        const remainingSeconds = remainingBlocks * 5;
        const remainingHours =
          (remainingSeconds - (remainingSeconds % 3600)) / 3600;
        const remainingMinutes =
          ((remainingSeconds % 3600) - (remainingSeconds % 60)) / 60;
        this.remainingTime = `${remainingHours} Hours ${remainingMinutes} Minutes`;
      }

    }

  }

  formDisabled(): boolean {
    /** No user connected */
    if (!this.user) {
      return true;
    }

    /** No asset amount set */
    if (!this.removeAssetAmount || (this.removeAssetAmount && this.removeAssetAmount <= 0)) {
      return true;
    }

    if (this.remainingTime) {
      return true;
    }

    /** Amount too small - dusting */
    if (this.removeAssetAmount <= this.userService.minimumSpendable(this.asset)) {
      return true;
    }

    return false;

  }

  mainButtonText(): string {
    /** No user connected */
    if (!this.user) {
      return 'Please Connect Wallet';
    }

    /** No asset amount set */
    if (!this.removeAssetAmount || (this.removeAssetAmount && this.removeAssetAmount <= 0)) {
      return 'Enter an Amount';
    }

    if (this.remainingTime) {
      return `Withdraw enabled in ${this.remainingTime}`;
    }

    /** Good to go */
    return 'Withdraw';
  }

  openConfirmationDialog(): void {

    const runeBasePrice = getValueOfAssetInRune(assetToBase(assetAmount(1)), this.assetPoolData).amount().div(10 ** 8).toNumber();
    const assetBasePrice = getValueOfRuneInAsset(assetToBase(assetAmount(1)), this.assetPoolData).amount().div(10 ** 8).toNumber();

    const dialogRef = this.dialog.open(
      ConfirmWithdrawModalComponent,
      {
        // width: '50vw',
        maxWidth: '420px',
        width: '50vw',
        minWidth: '310px',
        data: {
          asset: this.asset,
          rune: this.rune,
          assetAmount: this.removeAssetAmount,
          runeAmount: this.removeRuneAmount,
          user: this.user,
          unstakePercent: this.withdrawPercent,
          runeBasePrice,
          assetBasePrice,
          outboundTransactionFee: this.outboundTransactionFee
        }
      }
    );

    dialogRef.afterClosed().subscribe( (transactionSuccess: boolean) => {

      if (transactionSuccess) {
        this.withdrawPercent = 0;
      }

    });
  }

  back() {
    this.router.navigate(['/', 'pool']);
  }

  async getPoolDetail(asset: string) {

    const inboundAddresses = await this.midgardService.getInboundAddresses().toPromise();

    this.midgardService.getPool(asset).subscribe(
      (res) => {
        if (res) {
          this.assetPoolData = {
            assetBalance: baseAmount(res.assetDepth),
            runeBalance: baseAmount(res.runeDepth),
          };
          this.poolUnits = +res.units;

          this.runeBasePrice = getValueOfAssetInRune(assetToBase(assetAmount(1)), this.assetPoolData).amount().div(10 ** 8).toNumber();
          this.assetBasePrice = getValueOfRuneInAsset(assetToBase(assetAmount(1)), this.assetPoolData).amount().div(10 ** 8).toNumber();

          this.networkFee = this.txUtilsService.calculateNetworkFee(this.asset, inboundAddresses, res);

          this.calculate();
        }
      },
      (err) => console.error('error getting pool detail: ', err)
    );

  }

}
