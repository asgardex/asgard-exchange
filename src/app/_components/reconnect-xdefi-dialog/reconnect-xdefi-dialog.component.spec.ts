import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReconnectXDEFIDialogComponent } from './reconnect-xdefi-dialog.component';

describe('ReconnectDialogComponent', () => {
  let component: ReconnectXDEFIDialogComponent;
  let fixture: ComponentFixture<ReconnectXDEFIDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReconnectXDEFIDialogComponent],
      imports: [MatIconModule, HttpClientTestingModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            keystore: null,
          },
        },
        { provide: MatDialogRef, useValue: { close: () => {} } },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReconnectXDEFIDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
