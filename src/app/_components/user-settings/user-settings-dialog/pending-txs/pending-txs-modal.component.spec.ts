import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { PendingTxsModalComponent } from './pending-txs-modal.component';

describe('PendingTxsModalComponent', () => {
  let component: PendingTxsModalComponent;
  let fixture: ComponentFixture<PendingTxsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PendingTxsModalComponent],
      imports: [MatIconModule, HttpClientTestingModule],
      providers: [{ provide: MatDialogRef, useValue: { close: () => {} } }],
    }).compileComponents();
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
