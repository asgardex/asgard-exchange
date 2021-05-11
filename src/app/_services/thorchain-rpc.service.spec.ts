import { TestBed } from '@angular/core/testing';

import { ThorchainRpcService } from './thorchain-rpc.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ThorchainRpcService', () => {
  let service: ThorchainRpcService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ThorchainRpcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
