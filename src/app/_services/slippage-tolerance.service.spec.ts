import { TestBed } from '@angular/core/testing';

import { SlippageToleranceService } from './slippage-tolerance.service';

describe('SlipLimitService', () => {
  let service: SlippageToleranceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SlippageToleranceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
