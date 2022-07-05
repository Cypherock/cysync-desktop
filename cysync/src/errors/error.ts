import { CodeToErrorMap, ErrorsSet } from './types';

class DisplayError {
  protected code: string;
  protected message: string;
  public isSet: boolean;
  constructor(code: string, message: string) {
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
  constructor(code?: ErrorsSet) {
    if (code) {
      const parentError = CyError.map[code].parent;
      if (parentError) {
        super(parentError, CyError.map[parentError].message);
      } else {
        super(code, CyError.map[code].message);
      }
    } else {
      super(undefined, undefined);
    }
    this.childErrors = [];
  }
  public setError(code: string, message: string) {
    this.isSet = true;
    this.code = code;
    this.message = message;
  }
  public pushSubErrors(code: string, message: string) {
    this.childErrors.push(new DisplayError(code, message));
  }
}

export { DisplayError, CyError };
