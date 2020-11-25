import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoolCreateComponent } from './pool-create.component';

describe('PoolCreateComponent', () => {
  let component: PoolCreateComponent;
  let fixture: ComponentFixture<PoolCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PoolCreateComponent ]
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
