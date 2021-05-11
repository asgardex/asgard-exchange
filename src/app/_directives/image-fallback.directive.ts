import { Directive, Input, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: 'img[appImgFallback]',
})
export class ImgFallbackDirective {
  @Input() appImgFallback: string;

  constructor(private eRef: ElementRef) {}

  @HostListener('error')
  loadFallbackOnError() {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const element: HTMLImageElement = <HTMLImageElement>this.eRef.nativeElement;
    element.src = this.appImgFallback || '/assets/icons/help_outline.svg';
  }
}
