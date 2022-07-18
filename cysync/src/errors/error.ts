import { CodeToErrorMap, ErrorsSet } from './types';

class DisplayError {
  protected code: ErrorsSet;
  protected message: string;
  public isSet: boolean;
  constructor(code: ErrorsSet, message: string) {
    this.isSet = Boolean(code && message);
    this.code = code;
    this.message = message;
  }
  /**
   * used to display errors to the user
   * @returns formatted error string
   */
  public showError() {
    if (this.isSet) return this.getCode() + ' : ' + this.getMessage();
    return '';
  }
  /**
   * Use this only when the error message text is needed
   * @returns error message
   */
  public getMessage() {
    return this.message || '';
  }
  /**
   * Use this only when the error code is needed
   * @returns error code
   */
  public getCode() {
    return this.code || '';
  }
}
/* tslint:disable-next-line */
class CyError extends DisplayError {
  public childErrors: DisplayError[];
  static map: CodeToErrorMap;
  constructor(code?: ErrorsSet, meta?: string) {
    super(undefined, undefined);
    this.childErrors = [];
    //Initialising empty Object
    if (!code) return;
    this.setError(code, meta);
  }
  public setError(code: ErrorsSet, meta?: string) {
    this.isSet = true;
    let parentCode = code;
    // Traverse the object tree until parent error is reached
    // Only parent errors are displayed in the UI
    while (CyError.map[parentCode].parent) {
      parentCode = CyError.map[parentCode].parent;
    }
    this.code = parentCode;

    // Handle strings and function I18N values
    const messageUnion = CyError.map[parentCode].message;
    if (meta && typeof messageUnion === 'function') {
      this.message = messageUnion(meta);
    } else if (typeof messageUnion === 'string') {
      this.message = messageUnion;
    }
  }
  public pushSubErrors(code: ErrorsSet, meta?: string) {
    const messageUnion = CyError.map[code].message;
    let dispError;
    if (messageUnion === 'string')
      dispError = new DisplayError(code, messageUnion);
    else if (meta && typeof messageUnion === 'function')
      dispError = new DisplayError(code, messageUnion(meta));
    this.childErrors.push(dispError);
    return dispError;
  }

  public compare(err: CyError) {
    return this.getCode() === err.getCode();
  }
}

export { DisplayError, CyError };
