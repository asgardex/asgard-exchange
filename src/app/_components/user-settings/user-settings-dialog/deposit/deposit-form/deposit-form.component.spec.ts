import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { DepositFormComponent } from './deposit-form.component';

describe('DepositFormComponent', () => {
  let component: DepositFormComponent;
  let fixture: ComponentFixture<DepositFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DepositFormComponent],
      imports: [HttpClientTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DepositFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
