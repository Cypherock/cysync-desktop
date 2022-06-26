class DisplayError {
  protected code: string;
  protected message: string;
  public isSet: boolean;
  constructor(code: string, message: string) {
    this.isSet = Boolean(code && message);
    this.code = code;
    this.message = message;
  }
  public getMessage() {
    return this.message || '';
  }
  public getCode() {
    return this.code || '';
  }
  public showError() {
    return this.getCode() + ' : ' + this.getMessage();
  }
}
/* tslint:disable-next-line */
class CyError extends DisplayError {
  public childErrors: DisplayError[];
  constructor(code?: string, message?: string) {
    super(code, message);
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
