import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoolTypeOptionsComponent } from './pool-type-options.component';

describe('PoolTypeOptionsComponent', () => {
  let component: PoolTypeOptionsComponent;
  let fixture: ComponentFixture<PoolTypeOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PoolTypeOptionsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PoolTypeOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
