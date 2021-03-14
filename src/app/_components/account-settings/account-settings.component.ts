import { Component, OnInit } from '@angular/core';
import { MainViewsEnum, OverlaysService } from 'src/app/_services/overlays.service';

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.scss']
})
export class AccountSettingsComponent implements OnInit {

  loading: boolean;
  mode: 'PHRASE' | 'ACCOUNT' | 'SLIP';

  constructor(private overlaysService: OverlaysService) {
    this.mode = 'ACCOUNT';
  }

  ngOnInit(): void {
    this.loading = true;
  }

  close() {
    this.overlaysService.setViews(MainViewsEnum.Swap, 'Swap');
  }

}
