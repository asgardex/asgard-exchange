import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { WalletConnectService } from './wallet-connect.service';

describe('WalletConnectService', () => {
  let service: WalletConnectService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ]
    });
    service = TestBed.inject(WalletConnectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
