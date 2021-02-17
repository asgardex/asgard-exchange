import { TestBed } from '@angular/core/testing';

import { EthUtilsService } from './eth-utils.service';

describe('EthUtilsService', () => {
  let service: EthUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EthUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
