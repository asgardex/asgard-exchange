import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmStakeModalComponent } from './confirm-stake-modal.component';

describe('ConfirmStakeModalComponent', () => {
  let component: ConfirmStakeModalComponent;
  let fixture: ComponentFixture<ConfirmStakeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmStakeModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmStakeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
