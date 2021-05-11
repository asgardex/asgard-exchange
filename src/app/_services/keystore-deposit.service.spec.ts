import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { KeystoreDepositService } from './keystore-deposit.service';

describe('KeystoreDepositService', () => {
  let service: KeystoreDepositService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(KeystoreDepositService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
