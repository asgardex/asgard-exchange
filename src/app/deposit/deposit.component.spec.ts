import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DepositComponent } from './deposit.component';
import { MatDialogModule } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AssetInputModule } from '../_components/asset-input/asset-input.module';
import { MatIconModule } from '@angular/material/icon';

describe('DepositComponent', () => {
  let component: DepositComponent;
  let fixture: ComponentFixture<DepositComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DepositComponent],
      imports: [
        MatDialogModule,
        RouterTestingModule,
        HttpClientTestingModule,
        AssetInputModule,
        MatIconModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepositComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
