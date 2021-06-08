import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { SwapComponent } from './swap.component';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AssetInputModule } from '../_components/asset-input/asset-input.module';
import { MatIconModule } from '@angular/material/icon';
import { RouterTestingModule } from '@angular/router/testing';

describe('SwapComponent', () => {
  let component: SwapComponent;
  let fixture: ComponentFixture<SwapComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [SwapComponent],
        providers: [{ provide: MAT_DIALOG_DATA, useValue: {} }],
        imports: [
          MatDialogModule,
          HttpClientTestingModule,
          AssetInputModule,
          MatIconModule,
          RouterTestingModule,
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(SwapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
