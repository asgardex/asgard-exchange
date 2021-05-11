import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TransactionStatusService } from 'src/app/_services/transaction-status.service';

import { UserSettingsDialogComponent } from './user-settings-dialog.component';

describe('UserSettingsComponent', () => {
  let component: UserSettingsDialogComponent;
  let fixture: ComponentFixture<UserSettingsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserSettingsDialogComponent],
      imports: [MatIconModule, MatIconModule, HttpClientTestingModule],
      providers: [
        TransactionStatusService,
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserSettingsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
