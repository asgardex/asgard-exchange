import { TestBed } from '@angular/core/testing';

import { CoinGeckoService } from './coin-gecko.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CoinGeckoService', () => {
  let service: CoinGeckoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(CoinGeckoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
