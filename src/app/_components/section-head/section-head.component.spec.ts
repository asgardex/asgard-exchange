import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionHeadComponent } from './section-head.component';

describe('SectionHeadComponent', () => {
  let component: SectionHeadComponent;
  let fixture: ComponentFixture<SectionHeadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SectionHeadComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SectionHeadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
