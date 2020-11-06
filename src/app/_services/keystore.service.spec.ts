import { TestBed } from '@angular/core/testing';

import { KeystoreService } from './keystore.service';

describe('KeystoreService', () => {
  let service: KeystoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KeystoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
