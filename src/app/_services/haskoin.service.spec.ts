import { TestBed } from '@angular/core/testing';

import { HaskoinService } from './haskoin.service';

describe('HaskoinService', () => {
  let service: HaskoinService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HaskoinService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
