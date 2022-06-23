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
  UNKNOWN_ERROR = 'DS_CONN_5500',
  UNKNOWN_FLOW_ERROR = 'DS_MISC_5500',

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
  code: string;
  message: string;
}
/* tslint:disable-next-line */
class CyError extends DisplayError {
  public childErrors: DisplayError[];
  constructor(code?: string, message?: string) {
    super();
    this.code = code;
    this.message = message;
    this.childErrors = [];
  }
  public pushSubErrors(err: DisplayError) {
    this.childErrors.push(err);
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
