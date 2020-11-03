import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAssetComponent } from './user-asset.component';

describe('UserAssetComponent', () => {
  let component: UserAssetComponent;
  let fixture: ComponentFixture<UserAssetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserAssetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAssetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
