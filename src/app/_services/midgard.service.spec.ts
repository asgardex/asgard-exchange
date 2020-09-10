import { TestBed } from '@angular/core/testing';

import { MidgardService } from './midgard.service';

describe('MidgardService', () => {
  let service: MidgardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MidgardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
