import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingTxsModalComponent } from './pending-txs-modal.component';

describe('PendingTxsModalComponent', () => {
  let component: PendingTxsModalComponent;
  let fixture: ComponentFixture<PendingTxsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PendingTxsModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PendingTxsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
