import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDepositModalComponent } from './confirm-deposit-modal.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Asset } from 'src/app/_classes/asset';
import { User } from 'src/app/_classes/user';
import { MatIconModule } from '@angular/material/icon';

describe('ConfirmDepositModalComponent', () => {
  let component: ConfirmDepositModalComponent;
  let fixture: ComponentFixture<ConfirmDepositModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmDepositModalComponent],
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
          },
        },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
      imports: [HttpClientTestingModule, MatIconModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmDepositModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
