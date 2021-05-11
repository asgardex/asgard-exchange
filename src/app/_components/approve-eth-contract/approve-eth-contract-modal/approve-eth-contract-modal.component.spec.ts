import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Asset } from 'src/app/_classes/asset';
import { ApproveEthContractModalComponent } from './approve-eth-contract-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ApproveEthContractModalComponent', () => {
  let component: ApproveEthContractModalComponent;
  let fixture: ComponentFixture<ApproveEthContractModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ApproveEthContractModalComponent],
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            contractAddress: '0x9d496De78837f5a2bA64Cb40E62c19FBcB67f55a',
            asset: new Asset(
              'ETH.DAI-0XAD6D458402F60FD3BD25163575031ACDCE07538D'
            ),
          },
        },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }).compileComponents();
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
