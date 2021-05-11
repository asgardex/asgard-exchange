import { TestBed } from '@angular/core/testing';

import { TransactionStatusService } from './transaction-status.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MidgardService } from './midgard.service';
import { UserService } from './user.service';

describe('TransactionStatusService', () => {
  let service: TransactionStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MidgardService, UserService],
    });
    service = TestBed.inject(TransactionStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
