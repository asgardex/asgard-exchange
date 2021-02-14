import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveEthContractComponent } from './approve-eth-contract.component';

describe('ApproveEthContractComponent', () => {
  let component: ApproveEthContractComponent;
  let fixture: ComponentFixture<ApproveEthContractComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApproveEthContractComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApproveEthContractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
