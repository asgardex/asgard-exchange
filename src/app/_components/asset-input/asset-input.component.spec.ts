import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetInputComponent } from './asset-input.component';
import { MatDialogModule } from '@angular/material/dialog';
import { IconTickerModule } from '../icon-ticker/icon-ticker.module';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AssetInputComponent', () => {
  let component: AssetInputComponent;
  let fixture: ComponentFixture<AssetInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssetInputComponent],
      imports: [
        MatDialogModule,
        IconTickerModule,
        MatIconModule,
        HttpClientTestingModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
