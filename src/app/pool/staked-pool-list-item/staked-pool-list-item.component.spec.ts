import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { IconTickerModule } from 'src/app/_components/icon-ticker/icon-ticker.module';

import { StakedPoolListItemComponent } from './staked-pool-list-item.component';

describe('StakedPoolListItemComponent', () => {
  let component: StakedPoolListItemComponent;
  let fixture: ComponentFixture<StakedPoolListItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StakedPoolListItemComponent],
      imports: [IconTickerModule, MatIconModule],
    }).compileComponents();
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
