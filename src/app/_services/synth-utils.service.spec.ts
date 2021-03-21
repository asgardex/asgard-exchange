import { TestBed } from '@angular/core/testing';

import { SynthUtilsService } from './synth-utils.service';

describe('SynthUtilsService', () => {
  let service: SynthUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SynthUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
