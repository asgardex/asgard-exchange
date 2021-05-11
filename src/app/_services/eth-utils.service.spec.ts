import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EthUtilsService } from './eth-utils.service';

describe('EthUtilsService', () => {
  let service: EthUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(EthUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
