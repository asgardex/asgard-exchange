import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgradeRuneComponent } from './upgrade-rune.component';

describe('UpgradeRuneComponent', () => {
  let component: UpgradeRuneComponent;
  let fixture: ComponentFixture<UpgradeRuneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpgradeRuneComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpgradeRuneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
