import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlippageToleranceComponent } from './slippage-tolerance.component';

describe('SlippageToleranceComponent', () => {
  let component: SlippageToleranceComponent;
  let fixture: ComponentFixture<SlippageToleranceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SlippageToleranceComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SlippageToleranceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
