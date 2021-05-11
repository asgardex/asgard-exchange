import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { WithdrawComponent } from './withdraw.component';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AssetInputModule } from '../_components/asset-input/asset-input.module';
import { MatSliderModule } from '@angular/material/slider';
import { IconTickerModule } from '../_components/icon-ticker/icon-ticker.module';
import { MatIconModule } from '@angular/material/icon';

describe('WithdrawComponent', () => {
  let component: WithdrawComponent;
  let fixture: ComponentFixture<WithdrawComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WithdrawComponent],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: {} }],
      imports: [
        MatDialogModule,
        RouterTestingModule,
        HttpClientTestingModule,
        AssetInputModule,
        MatSliderModule,
        IconTickerModule,
        MatIconModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WithdrawComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
