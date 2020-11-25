import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoolCreateComponent } from './pool-create.component';
import { MatDialogModule } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('PoolCreateComponent', () => {
  let component: PoolCreateComponent;
  let fixture: ComponentFixture<PoolCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PoolCreateComponent ],
      imports: [ MatDialogModule, HttpClientTestingModule, RouterTestingModule ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PoolCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
