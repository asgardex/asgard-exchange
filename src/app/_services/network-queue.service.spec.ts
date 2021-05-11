import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NetworkQueueService } from './network-queue.service';

describe('NetworkQueueService', () => {
  let service: NetworkQueueService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(NetworkQueueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
