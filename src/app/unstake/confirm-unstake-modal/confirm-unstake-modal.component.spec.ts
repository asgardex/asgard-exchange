import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmUnstakeModalComponent } from './confirm-unstake-modal.component';

describe('ConfirmUnstakeModalComponent', () => {
  let component: ConfirmUnstakeModalComponent;
  let fixture: ComponentFixture<ConfirmUnstakeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmUnstakeModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmUnstakeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
