import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeystoreConnectComponent } from './keystore-connect.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';

describe('KeystoreConnectComponent', () => {
  let component: KeystoreConnectComponent;
  let fixture: ComponentFixture<KeystoreConnectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KeystoreConnectComponent],
      imports: [HttpClientTestingModule, MatIconModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KeystoreConnectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
