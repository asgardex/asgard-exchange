import { TestBed } from '@angular/core/testing';

import { HaskoinService } from './haskoin.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('HaskoinService', () => {
  let service: HaskoinService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(HaskoinService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
