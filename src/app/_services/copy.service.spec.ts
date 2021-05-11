import { TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { CopyService } from './copy.service';

describe('CopyService', () => {
  let service: CopyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule],
    });
    service = TestBed.inject(CopyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
