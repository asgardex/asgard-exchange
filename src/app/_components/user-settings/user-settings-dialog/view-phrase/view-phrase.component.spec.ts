import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPhraseComponent } from './view-phrase.component';

describe('ViewPhraseComponent', () => {
  let component: ViewPhraseComponent;
  let fixture: ComponentFixture<ViewPhraseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewPhraseComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewPhraseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
