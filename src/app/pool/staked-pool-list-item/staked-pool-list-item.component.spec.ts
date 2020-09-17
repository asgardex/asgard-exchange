import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StakedPoolListItemComponent } from './staked-pool-list-item.component';

describe('StakedPoolListItemComponent', () => {
  let component: StakedPoolListItemComponent;
  let fixture: ComponentFixture<StakedPoolListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StakedPoolListItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StakedPoolListItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
