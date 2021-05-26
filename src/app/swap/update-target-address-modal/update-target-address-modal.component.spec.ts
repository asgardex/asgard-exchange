import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UpdateTargetAddressModalComponent } from './update-target-address-modal.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User } from 'src/app/_classes/user';

describe('UpdateTargetAddressModalComponent', () => {
  let component: UpdateTargetAddressModalComponent;
  let fixture: ComponentFixture<UpdateTargetAddressModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [UpdateTargetAddressModalComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            chain: 'BTC',
            targetAddress: '',
            // user: new User({ type: 'keystore', wallet: '' }),
          },
        },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateTargetAddressModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
