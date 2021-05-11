import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAssetComponent } from './user-asset.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('UserAssetComponent', () => {
  let component: UserAssetComponent;
  let fixture: ComponentFixture<UserAssetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserAssetComponent],
      imports: [HttpClientTestingModule, MatIconModule, MatSnackBarModule],
    }).compileComponents();
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
