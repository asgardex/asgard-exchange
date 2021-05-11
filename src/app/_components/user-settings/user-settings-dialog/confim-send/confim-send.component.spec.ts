import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';

import { ConfimSendComponent } from './confim-send.component';

describe('ConfimSendComponent', () => {
  let component: ConfimSendComponent;
  let fixture: ComponentFixture<ConfimSendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfimSendComponent],
      imports: [MatIconModule, HttpClientTestingModule],
    }).compileComponents();
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
