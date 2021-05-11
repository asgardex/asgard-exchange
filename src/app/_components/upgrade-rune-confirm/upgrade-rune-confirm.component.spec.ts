import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { UpgradeRuneConfirmComponent } from './upgrade-rune-confirm.component';

describe('UpgradeRuneConfirmComponent', () => {
  let component: UpgradeRuneConfirmComponent;
  let fixture: ComponentFixture<UpgradeRuneConfirmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UpgradeRuneConfirmComponent],
      imports: [HttpClientTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpgradeRuneConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
