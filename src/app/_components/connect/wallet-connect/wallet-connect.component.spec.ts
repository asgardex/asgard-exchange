import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletConnectComponent } from './wallet-connect.component';

describe('WalletConnectComponent', () => {
  let component: WalletConnectComponent;
  let fixture: ComponentFixture<WalletConnectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WalletConnectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WalletConnectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
