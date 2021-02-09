import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NativeRunePromptModalComponent } from './native-rune-prompt-modal.component';

describe('NativeRunePromptModalComponent', () => {
  let component: NativeRunePromptModalComponent;
  let fixture: ComponentFixture<NativeRunePromptModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NativeRunePromptModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NativeRunePromptModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
