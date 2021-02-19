import { TestBed } from '@angular/core/testing';

import { SochainService } from './sochain.service';

describe('SochainService', () => {
  let service: SochainService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SochainService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
