import { TestBed } from '@angular/core/testing';

import { BlockchairService } from './blockchair.service';

describe('BlockchairService', () => {
  let service: BlockchairService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BlockchairService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
