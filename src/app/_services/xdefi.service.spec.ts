import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { XDEFIService } from './xdefi.service';

describe('XDEFIService', () => {
  let service: XDEFIService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(XDEFIService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
