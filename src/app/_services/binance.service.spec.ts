import { TestBed } from '@angular/core/testing';

import { BinanceService } from './binance.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('BinanceService', () => {
  let service: BinanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(BinanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
