import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UnstakeComponent } from './unstake.component';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('UnstakeComponent', () => {
  let component: UnstakeComponent;
  let fixture: ComponentFixture<UnstakeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnstakeComponent ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
      imports: [ MatDialogModule, RouterTestingModule, HttpClientTestingModule ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UnstakeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
