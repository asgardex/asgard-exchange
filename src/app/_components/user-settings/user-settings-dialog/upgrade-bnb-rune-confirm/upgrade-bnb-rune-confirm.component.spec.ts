import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgradeBnbRuneConfirmComponent } from './upgrade-bnb-rune-confirm.component';

describe('UpgradeBnbRuneConfirmComponent', () => {
  let component: UpgradeBnbRuneConfirmComponent;
  let fixture: ComponentFixture<UpgradeBnbRuneConfirmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpgradeBnbRuneConfirmComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpgradeBnbRuneConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
