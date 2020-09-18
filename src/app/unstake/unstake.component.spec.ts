import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnstakeComponent } from './unstake.component';

describe('UnstakeComponent', () => {
  let component: UnstakeComponent;
  let fixture: ComponentFixture<UnstakeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnstakeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UnstakeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
