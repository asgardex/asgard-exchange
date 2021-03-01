import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RightOptionComponent } from './right-option.component';

describe('RightOptionComponent', () => {
  let component: RightOptionComponent;
  let fixture: ComponentFixture<RightOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RightOptionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RightOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
