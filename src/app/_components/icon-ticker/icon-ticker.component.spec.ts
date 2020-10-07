import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconTickerComponent } from './icon-ticker.component';

describe('IconTickerComponent', () => {
  let component: IconTickerComponent;
  let fixture: ComponentFixture<IconTickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IconTickerComponent ]
    })
    .compileComponents();
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
