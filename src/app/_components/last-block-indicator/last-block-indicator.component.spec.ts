import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LastBlockIndicatorComponent } from './last-block-indicator.component';

describe('LastBlockIndicatorComponent', () => {
  let component: LastBlockIndicatorComponent;
  let fixture: ComponentFixture<LastBlockIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LastBlockIndicatorComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LastBlockIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
