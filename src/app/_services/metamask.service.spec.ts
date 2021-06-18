import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MetamaskService } from './metamask.service';

describe('MetamaskService', () => {
  let service: MetamaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(MetamaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
