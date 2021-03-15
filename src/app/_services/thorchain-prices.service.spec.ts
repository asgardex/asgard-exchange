import { TestBed } from '@angular/core/testing';

import { ThorchainPricesService } from './thorchain-prices.service';

describe('ThorchainPricesService', () => {
  let service: ThorchainPricesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThorchainPricesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
