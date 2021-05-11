import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketsModalComponent } from './markets-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

describe('MarketsModalComponent', () => {
  let component: MarketsModalComponent;
  let fixture: ComponentFixture<MarketsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MarketsModalComponent],
      imports: [HttpClientTestingModule, MatIconModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
