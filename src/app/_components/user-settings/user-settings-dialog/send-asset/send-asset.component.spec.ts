import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AssetInputModule } from 'src/app/_components/asset-input/asset-input.module';

import { SendAssetComponent } from './send-asset.component';

describe('SendAssetComponent', () => {
  let component: SendAssetComponent;
  let fixture: ComponentFixture<SendAssetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SendAssetComponent],
      imports: [
        AssetInputModule,
        MatIconModule,
        MatDialogModule,
        HttpClientTestingModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SendAssetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
