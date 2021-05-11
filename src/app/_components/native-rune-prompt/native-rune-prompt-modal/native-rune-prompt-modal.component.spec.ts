import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Asset } from 'src/app/_classes/asset';

import { NativeRunePromptModalComponent } from './native-rune-prompt-modal.component';

describe('NativeRunePromptModalComponent', () => {
  let component: NativeRunePromptModalComponent;
  let fixture: ComponentFixture<NativeRunePromptModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NativeRunePromptModalComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            asset: new Asset('BNB.RUNE'),
            amount: 1000,
          },
        },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }).compileComponents();
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
