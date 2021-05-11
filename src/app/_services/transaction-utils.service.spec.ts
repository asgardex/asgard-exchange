import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TransactionUtilsService } from './transaction-utils.service';

describe('TransactionUtilsService', () => {
  let service: TransactionUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(TransactionUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
