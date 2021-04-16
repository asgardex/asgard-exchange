import { TestBed } from '@angular/core/testing';

import { NetworkQueueService } from './network-queue.service';

describe('NetworkQueueService', () => {
  let service: NetworkQueueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NetworkQueueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
