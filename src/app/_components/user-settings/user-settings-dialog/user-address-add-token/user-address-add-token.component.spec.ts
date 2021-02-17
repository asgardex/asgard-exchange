import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAddressAddTokenComponent } from './user-address-add-token.component';

describe('UserAddressAddTokenComponent', () => {
  let component: UserAddressAddTokenComponent;
  let fixture: ComponentFixture<UserAddressAddTokenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserAddressAddTokenComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAddressAddTokenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
