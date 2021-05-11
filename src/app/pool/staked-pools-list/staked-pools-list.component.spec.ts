import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StakedPoolsListComponent } from './staked-pools-list.component';

describe('StakedPoolsListComponent', () => {
  let component: StakedPoolsListComponent;
  let fixture: ComponentFixture<StakedPoolsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StakedPoolsListComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StakedPoolsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
