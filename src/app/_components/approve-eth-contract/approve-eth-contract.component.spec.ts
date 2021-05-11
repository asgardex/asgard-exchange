import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ApproveEthContractComponent } from './approve-eth-contract.component';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

describe('ApproveEthContractComponent', () => {
  let component: ApproveEthContractComponent;
  let fixture: ComponentFixture<ApproveEthContractComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApproveEthContractComponent],
      imports: [HttpClientTestingModule, MatDialogModule],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: {} }],
    }).compileComponents();
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
