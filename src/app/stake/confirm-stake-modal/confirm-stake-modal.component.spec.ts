import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmStakeModalComponent } from './confirm-stake-modal.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Asset } from 'src/app/_classes/asset';
import { User } from 'src/app/_classes/user';

describe('ConfirmStakeModalComponent', () => {
  let component: ConfirmStakeModalComponent;
  let fixture: ComponentFixture<ConfirmStakeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmStakeModalComponent ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {
            asset: new Asset('BNB'),
            rune: new Asset('RUNE-B1A'),
            assetAmount: 100,
            runeAmount: 100,
            user: new User({type: 'keystore', wallet: ''}),
            runeBasePrice: 10000000,
            assetBasePrice: 11000000,
          }
        },
        { provide: MatDialogRef, useValue: { close: (dialogResult: any) => { } } }
      ],
      imports: [HttpClientTestingModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmStakeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
