import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeystoreCreateStorePhraseComponent } from './keystore-create-store-phrase.component';

describe('KeystoreCreateStorePhraseComponent', () => {
  let component: KeystoreCreateStorePhraseComponent;
  let fixture: ComponentFixture<KeystoreCreateStorePhraseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [KeystoreCreateStorePhraseComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KeystoreCreateStorePhraseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
