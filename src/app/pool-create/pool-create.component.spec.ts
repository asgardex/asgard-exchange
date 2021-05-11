import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoolCreateComponent } from './pool-create.component';
import { MatDialogModule } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

const spyParamMap = jasmine.createSpyObj({ get: null });
const mockActivatedRoute = { queryParamMap: of(spyParamMap) };

describe('PoolCreateComponent', () => {
  let component: PoolCreateComponent;
  let fixture: ComponentFixture<PoolCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PoolCreateComponent],
      imports: [MatDialogModule, HttpClientTestingModule, RouterTestingModule],
      providers: [{ provide: ActivatedRoute, useValue: mockActivatedRoute }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PoolCreateComponent);
    component = fixture.componentInstance;
    spyParamMap.get.and.returnValue('pool');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
