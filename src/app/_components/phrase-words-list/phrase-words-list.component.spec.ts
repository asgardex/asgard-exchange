import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhraseWordsListComponent } from './phrase-words-list.component';

describe('PhraseWordsListComponent', () => {
  let component: PhraseWordsListComponent;
  let fixture: ComponentFixture<PhraseWordsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PhraseWordsListComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PhraseWordsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
