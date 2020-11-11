import { TestBed } from '@angular/core/testing';

import { BlockchairService } from './blockchair.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('BlockchairService', () => {
  let service: BlockchairService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(BlockchairService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
