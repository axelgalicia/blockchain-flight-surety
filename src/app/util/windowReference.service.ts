
import { Injectable } from '@angular/core';

function _window(): any {
  // return the global native browser window object
  return window;
}
@Injectable()
export class WindowReferenceService {
  get nativeWindow(): any {
    return _window();
  }
}