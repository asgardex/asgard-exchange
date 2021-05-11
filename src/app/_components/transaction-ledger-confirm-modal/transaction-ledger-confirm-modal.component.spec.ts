import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionLedgerConfirmModalComponent } from './transaction-ledger-confirm-modal.component';

describe('TransactionLedgerConfirmModalComponent', () => {
  let component: TransactionLedgerConfirmModalComponent;
  let fixture: ComponentFixture<TransactionLedgerConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TransactionLedgerConfirmModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionLedgerConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
