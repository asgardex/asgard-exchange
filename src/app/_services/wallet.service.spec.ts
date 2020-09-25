import { TestBed } from '@angular/core/testing';

import { WalletService } from './wallet.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('WalletService', () => {
  let service: WalletService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(WalletService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
