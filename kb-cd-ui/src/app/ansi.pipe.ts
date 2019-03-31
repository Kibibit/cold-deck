import { Pipe, PipeTransform } from '@angular/core';
import * as Convert from 'ansi-to-html';
import { DomSanitizer } from '@angular/platform-browser';

const convert = new Convert();

@Pipe({
  name: 'ansi'
})
export class AnsiPipe implements PipeTransform {

  constructor(private sanitized: DomSanitizer) { }

  transform(value: any, args?: any): any {
    console.log('got this!');
    console.log(convert.toHtml(value));
    return value ? this.sanitized.bypassSecurityTrustHtml(convert.toHtml(value)) : value;
  }

}
