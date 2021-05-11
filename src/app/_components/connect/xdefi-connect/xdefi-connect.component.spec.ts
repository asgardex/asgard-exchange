import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XDEFIConnectComponent } from './xdefi-connect.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';

describe('XDEFIConnectComponent', () => {
  let component: XDEFIConnectComponent;
  let fixture: ComponentFixture<XDEFIConnectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [XDEFIConnectComponent],
      imports: [HttpClientTestingModule, MatIconModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(XDEFIConnectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
