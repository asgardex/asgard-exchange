import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmUnstakeModalComponent } from './confirm-unstake-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { User } from 'src/app/_classes/user';
import { Asset } from 'src/app/_classes/asset';

describe('ConfirmUnstakeModalComponent', () => {
  let component: ConfirmUnstakeModalComponent;
  let fixture: ComponentFixture<ConfirmUnstakeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmUnstakeModalComponent ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {
            asset: new Asset('BNB'),
            rune: new Asset('RUNE-B1A'),
            assetAmount: 100,
            runeAmount: 100,
            user: new User({type: 'keystore', wallet: ''}),
            runeBasePrice: 10000000,
            assetBasePrice: 11000000,
            unstakePercent: 0
          }
        },
        { provide: MatDialogRef, useValue: {} }
      ],
      imports: [
        HttpClientTestingModule,
        MatIconModule
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmUnstakeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
