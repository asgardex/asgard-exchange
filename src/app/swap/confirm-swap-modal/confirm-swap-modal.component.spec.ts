import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmSwapModalComponent } from './confirm-swap-modal.component';

describe('ConfirmSwapModalComponent', () => {
  let component: ConfirmSwapModalComponent;
  let fixture: ComponentFixture<ConfirmSwapModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmSwapModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmSwapModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
