import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmSwapModalComponent } from './confirm-swap-modal.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Asset } from 'src/app/_classes/asset';
import { User } from 'src/app/_classes/user';

describe('ConfirmSwapModalComponent', () => {
  let component: ConfirmSwapModalComponent;
  let fixture: ComponentFixture<ConfirmSwapModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmSwapModalComponent ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {
            sourceAsset: new Asset('RUNE-B1A'),
            targetAsset: new Asset('BNB'),
            runeFee: 100000000,
            bnbFee: 0.0000035,
            basePrice: 100000000,
            inputValue: 1000000000,
            outputValue: 1100000000,
            user: new User({type: 'keystore', wallet: '', clients: {}}),
            slip: .03
          }
        },
        { provide: MatDialogRef, useValue: { close: (dialogResult: any) => { } } }
      ],
      imports: [HttpClientTestingModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmSwapModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
