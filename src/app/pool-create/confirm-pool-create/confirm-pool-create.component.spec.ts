import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmPoolCreateComponent } from './confirm-pool-create.component';
import { Asset } from 'src/app/_classes/asset';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ConfirmPoolCreateComponent', () => {
  let component: ConfirmPoolCreateComponent;
  let fixture: ComponentFixture<ConfirmPoolCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfirmPoolCreateComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            asset: new Asset('BUSD'),
            rune: new Asset('RUNE-B1A'),
            assetAmount: 100,
            runeAmount: 100,
          },
        },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
      imports: [HttpClientTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmPoolCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
