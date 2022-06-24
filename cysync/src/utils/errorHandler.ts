import { ipcRenderer } from 'electron';

import logger from './logger';
import getUUID from './uuid';

const setErrorHandler = () => {
  window.onerror = async (error, url, line) => {
    const userId = await getUUID();
    logger.error('Error caught in error handler', {
      error,
      url,
      line,
      uuid: userId
    });
    ipcRenderer.send('renderer-error', {
      error,
      url,
      line,
      uuid: userId
    });
  };
};

export enum CysyncError {
  UNKNOWN_FLOW_ERROR = 'DS_MISC_5500',
  CUSTOM_ERROR = 'DS_MISC_5501',

  NETWORK_ERROR = 'DS_CONN_3001',
  NETWORK_FAILURE = 'DS_CONN_3002',
  NETWORK_UNREACHABLE = 'DS_CONN_2001'
}

export enum FLOWS {
  DEVICE_AUTH
}

// Run as soon as imported, to set the handler before other imports
setErrorHandler();

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

const handleErrors = (err: CyError, flow?: string, metadata?: any) => {
  // log the original error
  logger.error('Origin Errors');
  err.childErrors.forEach(e => logger.error(e));
  // report to analytics
  // narrow down to the parent
  // const parentError = code.replace(
  //   /.$/,
  //   '0'
  // ) as unknown as keyof I18nStrings['ERRORS'];
  // // format and send the error
  // console.log(
  //   code,
  //   parentError,
  //   Object.prototype.hasOwnProperty.call(langStrings.ERRORS, parentError)
  // );
  // let errorMessage;
  // if (Object.prototype.hasOwnProperty.call(langStrings.ERRORS, parentError)) {
  //   return encodeError(parentError, langStrings.ERRORS[parentError](metadata));
  // } else {
  //   return encodeError(
  //     DeviceErrorType.UNKNOWN_ERROR,
  //     langStrings.ERRORS.UNKNOWN_FLOW_ERROR
  //   );
  // }
};

// const encodeError = (code: string, message: string) => code + '|' + message;
// const decodeError = (encodedString: string) => encodedString.split('|');
export { DisplayError, CyError, handleErrors };
