import logger from '../utils/logger';

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
    if (this.isSet) return this.getCode() + ': ' + this.getMessage();
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
  /**
   * Errors are structure in a way that the second sentence of the error
   * message can be substituted for the action message.
   * Mostly needed on Tooltips
   * @returns action message
   */
  public getActionMessage() {
    const sentences = this.message.split('.');
    if (sentences.length > 1) return sentences[1];
    logger.warn(`Action Message not found for error: ${this.showError()}`);
    return 'Please restart the operation altogether and try again.';
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
    while (CyError.map[parentCode]?.parent) {
      parentCode = CyError.map[parentCode]?.parent;
    }
    this.code = parentCode;

    // Handle strings and function I18N values
    const messageUnion = CyError.map[parentCode]?.message;
    if (meta && typeof messageUnion === 'function') {
      this.message = messageUnion(meta);
    } else if (typeof messageUnion === 'string') {
      this.message = messageUnion;
    }
  }

  public pushSubErrors(code: ErrorsSet, meta?: string) {
    const messageUnion = CyError.map[code].message;
    let dispError;
    if (typeof messageUnion === 'string') {
      dispError = new DisplayError(code, messageUnion);
    } else if (meta && typeof messageUnion === 'function') {
      dispError = new DisplayError(code, messageUnion(meta));
    }

    if (!dispError) {
      logger.error('Cannot find proper messageUnion for the error code', {
        code,
        meta
      });
    } else {
      this.childErrors.push(dispError);
    }
    return dispError;
  }

  public isEqualTo(err: CyError) {
    return this.getCode() === err.getCode();
  }
}

export { DisplayError, CyError };
