import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { UserSettingsComponent } from './user-settings.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TransactionStatusService } from 'src/app/_services/transaction-status.service';

describe('UserSettingsComponent', () => {
  let component: UserSettingsComponent;
  let fixture: ComponentFixture<UserSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserSettingsComponent],
      imports: [MatDialogModule, HttpClientTestingModule],
      providers: [
        TransactionStatusService,
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
