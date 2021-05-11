import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { UserAddressComponent } from './user-address.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('UserAddressComponent', () => {
  let component: UserAddressComponent;
  let fixture: ComponentFixture<UserAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserAddressComponent],
      imports: [MatSnackBarModule, MatIconModule, HttpClientTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
