import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfimSendComponent } from './confim-send.component';

describe('ConfimSendComponent', () => {
  let component: ConfimSendComponent;
  let fixture: ComponentFixture<ConfimSendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfimSendComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfimSendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
