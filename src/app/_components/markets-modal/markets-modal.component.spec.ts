import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketsModalComponent } from './markets-modal.component';

describe('MarketsModalComponent', () => {
  let component: MarketsModalComponent;
  let fixture: ComponentFixture<MarketsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarketsModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
