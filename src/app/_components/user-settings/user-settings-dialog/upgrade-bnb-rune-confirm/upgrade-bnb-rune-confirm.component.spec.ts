import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { UpgradeBnbRuneConfirmComponent } from './upgrade-bnb-rune-confirm.component';

describe('UpgradeBnbRuneConfirmComponent', () => {
  let component: UpgradeBnbRuneConfirmComponent;
  let fixture: ComponentFixture<UpgradeBnbRuneConfirmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpgradeBnbRuneConfirmComponent ],
      imports: [ HttpClientTestingModule ]
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
