import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendAssetComponent } from './send-asset.component';

describe('SendAssetComponent', () => {
  let component: SendAssetComponent;
  let fixture: ComponentFixture<SendAssetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SendAssetComponent ]
    })
    .compileComponents();
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
