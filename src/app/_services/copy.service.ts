import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class CopyService {

  constructor(private _snackBar: MatSnackBar) { }

  // pulled from https://stackoverflow.com/a/58276867/3703043
  copyToClipboard(textToCopy) {
    let textArea;

    function isOS() {
      // can use a better detection logic here
      return navigator.userAgent.match(/ipad|iphone/i);
    }

    function createTextArea(text) {
      textArea = document.createElement('textArea');
      textArea.readOnly = true;
      textArea.contentEditable = true;
      textArea.value = text;
      document.body.appendChild(textArea);
    }

    function selectText() {
      let range;
      let selection;

      if (isOS()) {
        range = document.createRange();
        range.selectNodeContents(textArea);
        selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        textArea.setSelectionRange(0, 999999);
      } else {
        textArea.select();
      }
    }

    function copyTo() {
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    createTextArea(textToCopy);
    selectText();
    copyTo();

    this._snackBar.open('Copied to Clipboard', '', {
      duration: 2000,
    });

  }

}
