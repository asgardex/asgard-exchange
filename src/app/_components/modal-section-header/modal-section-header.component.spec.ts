import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalSectionHeaderComponent } from './modal-section-header.component';

describe('ModalSectionHeaderComponent', () => {
  let component: ModalSectionHeaderComponent;
  let fixture: ComponentFixture<ModalSectionHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalSectionHeaderComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalSectionHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
