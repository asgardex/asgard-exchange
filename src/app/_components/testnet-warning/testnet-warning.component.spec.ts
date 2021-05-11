import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestnetWarningComponent } from './testnet-warning.component';

describe('TestnetWarningComponent', () => {
  let component: TestnetWarningComponent;
  let fixture: ComponentFixture<TestnetWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestnetWarningComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestnetWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
