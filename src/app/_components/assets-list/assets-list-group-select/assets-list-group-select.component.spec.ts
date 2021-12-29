import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetsListGroupSelectComponent } from './assets-list-group-select.component';

describe('AssetsListGroupSelectComponent', () => {
  let component: AssetsListGroupSelectComponent;
  let fixture: ComponentFixture<AssetsListGroupSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssetsListGroupSelectComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AssetsListGroupSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
