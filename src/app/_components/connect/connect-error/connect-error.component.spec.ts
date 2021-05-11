import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';

import { ConnectErrorComponent } from './connect-error.component';

describe('ConnectErrorComponent', () => {
  let component: ConnectErrorComponent;
  let fixture: ComponentFixture<ConnectErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConnectErrorComponent],
      imports: [MatIconModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
