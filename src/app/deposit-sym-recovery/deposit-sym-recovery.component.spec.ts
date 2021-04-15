import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepositSymRecoveryComponent } from './deposit-sym-recovery.component';

describe('DepositSymRecoveryComponent', () => {
  let component: DepositSymRecoveryComponent;
  let fixture: ComponentFixture<DepositSymRecoveryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DepositSymRecoveryComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepositSymRecoveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
