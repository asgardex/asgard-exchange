import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';

import { IconTickerComponent } from './icon-ticker.component';

describe('IconTickerComponent', () => {
  let component: IconTickerComponent;
  let fixture: ComponentFixture<IconTickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IconTickerComponent],
      imports: [MatIconModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IconTickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
