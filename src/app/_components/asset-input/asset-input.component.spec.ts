import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetInputComponent } from './asset-input.component';
import { MatDialogModule } from '@angular/material/dialog';

describe('AssetInputComponent', () => {
  let component: AssetInputComponent;
  let fixture: ComponentFixture<AssetInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssetInputComponent ],
      imports: [ MatDialogModule ]
    })
    .compileComponents();
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
