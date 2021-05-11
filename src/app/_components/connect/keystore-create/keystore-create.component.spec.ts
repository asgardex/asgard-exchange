import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { KeystoreCreateComponent } from './keystore-create.component';

describe('KeystoreCreateComponent', () => {
  let component: KeystoreCreateComponent;
  let fixture: ComponentFixture<KeystoreCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KeystoreCreateComponent],
      imports: [MatIconModule, HttpClientTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KeystoreCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
