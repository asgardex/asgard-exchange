import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class CopyService {

  constructor(private _snackBar: MatSnackBar) { }

  copyToClipboard(text: string) {
    const listener = (ev) => {
      ev.preventDefault();
      ev.clipboardData.setData('text/plain', text);
    };
    document.addEventListener('copy', listener);
    document.execCommand('copy');
    document.removeEventListener('copy', listener);

    this._snackBar.open('Copied to Clipboard', '', {
      duration: 2000,
    });

  }

}
