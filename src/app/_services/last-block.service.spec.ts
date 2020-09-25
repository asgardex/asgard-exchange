import { TestBed } from '@angular/core/testing';

import { LastBlockService } from './last-block.service';

describe('LastBlockService', () => {
  let service: LastBlockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LastBlockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
