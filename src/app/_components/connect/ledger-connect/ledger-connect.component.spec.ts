import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LedgerConnectComponent } from './ledger-connect.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';

describe('LedgerConnectComponent', () => {
  let component: LedgerConnectComponent;
  let fixture: ComponentFixture<LedgerConnectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LedgerConnectComponent ],
      imports: [ HttpClientTestingModule, MatIconModule ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LedgerConnectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
