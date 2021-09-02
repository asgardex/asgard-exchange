import { TestBed } from '@angular/core/testing';

import { SkipRedirectGuard } from './skip-redirect.guard';

describe('SkipRedirectGuard', () => {
  let guard: SkipRedirectGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(SkipRedirectGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
