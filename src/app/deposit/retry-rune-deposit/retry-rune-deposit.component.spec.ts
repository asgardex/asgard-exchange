import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RetryRuneDepositComponent } from './retry-rune-deposit.component';

describe('RetryRuneDepositComponent', () => {
  let component: RetryRuneDepositComponent;
  let fixture: ComponentFixture<RetryRuneDepositComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RetryRuneDepositComponent ],
      imports: [HttpClientTestingModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RetryRuneDepositComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
