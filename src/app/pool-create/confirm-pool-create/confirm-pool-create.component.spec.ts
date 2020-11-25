import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmPoolCreateComponent } from './confirm-pool-create.component';

describe('ConfirmPoolCreateComponent', () => {
  let component: ConfirmPoolCreateComponent;
  let fixture: ComponentFixture<ConfirmPoolCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmPoolCreateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmPoolCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
