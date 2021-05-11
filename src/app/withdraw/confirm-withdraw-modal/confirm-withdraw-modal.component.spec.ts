import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmWithdrawModalComponent } from './confirm-withdraw-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../_classes/user';
import { Asset } from '../../_classes/asset';

describe('ConfirmWithdrawModalComponent', () => {
  let component: ConfirmWithdrawModalComponent;
  let fixture: ComponentFixture<ConfirmWithdrawModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmWithdrawModalComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            asset: new Asset('BNB'),
            rune: new Asset('RUNE-B1A'),
            assetAmount: 100,
            runeAmount: 100,
            user: new User({ type: 'keystore', wallet: '' }),
            runeBasePrice: 10000000,
            assetBasePrice: 11000000,
            unstakePercent: 0,
          },
        },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
      imports: [HttpClientTestingModule, MatIconModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmWithdrawModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
