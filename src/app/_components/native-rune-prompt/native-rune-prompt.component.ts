import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AssetAndBalance } from 'src/app/_classes/asset-and-balance';
import { NativeRunePromptModalComponent } from './native-rune-prompt-modal/native-rune-prompt-modal.component';

@Component({
  selector: 'app-native-rune-prompt',
  templateUrl: './native-rune-prompt.component.html',
  styleUrls: ['./native-rune-prompt.component.scss']
})
export class NativeRunePromptComponent implements OnInit {

  @Input() nonNativeRuneAssets: AssetAndBalance[];

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
  }

  launchModal() {
    const dialogRef = this.dialog.open(
      NativeRunePromptModalComponent,
      {
        width: '50vw',
        maxWidth: '420px',
        minWidth: '260px',
        data: {
          assets: this.nonNativeRuneAssets,
        }
      }
    );
  }

}
