import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionProcessingModalComponent } from './transaction-processing-modal.component';

describe('TransactionProcessingModalComponent', () => {
  let component: TransactionProcessingModalComponent;
  let fixture: ComponentFixture<TransactionProcessingModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransactionProcessingModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransactionProcessingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
