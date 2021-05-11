import { TestBed } from '@angular/core/testing';

import { MidgardService } from './midgard.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('MidgardService', () => {
  let service: MidgardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(MidgardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
