import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';

import { TransactionSuccessModalComponent } from './transaction-success-modal.component';

describe('TransactionSuccessModalComponent', () => {
  let component: TransactionSuccessModalComponent;
  let fixture: ComponentFixture<TransactionSuccessModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TransactionSuccessModalComponent],
      imports: [MatIconModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionSuccessModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
