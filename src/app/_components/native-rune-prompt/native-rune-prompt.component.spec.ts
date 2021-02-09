import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NativeRunePromptComponent } from './native-rune-prompt.component';

describe('NativeRunePromptComponent', () => {
  let component: NativeRunePromptComponent;
  let fixture: ComponentFixture<NativeRunePromptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NativeRunePromptComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NativeRunePromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
