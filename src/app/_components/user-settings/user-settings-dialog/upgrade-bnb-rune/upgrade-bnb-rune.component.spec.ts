import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgradeBnbRuneComponent } from './upgrade-bnb-rune.component';

describe('UpgradeBnbRuneComponent', () => {
  let component: UpgradeBnbRuneComponent;
  let fixture: ComponentFixture<UpgradeBnbRuneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpgradeBnbRuneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpgradeBnbRuneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
