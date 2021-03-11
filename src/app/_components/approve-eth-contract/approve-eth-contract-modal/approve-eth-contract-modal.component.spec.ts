import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveEthContractModalComponent } from './approve-eth-contract-modal.component';

describe('ApproveEthContractModalComponent', () => {
  let component: ApproveEthContractModalComponent;
  let fixture: ComponentFixture<ApproveEthContractModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApproveEthContractModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApproveEthContractModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
