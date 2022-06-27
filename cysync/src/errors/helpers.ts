import { DeviceErrorType } from '@cypherock/communication';

import { I18nStrings } from '../constants/i18n';
import logger from '../utils/logger';

import { CyError } from './error';

const handleErrors = (
  currError: CyError,
  err: CyError,
  flow?: string,
  metadata?: any
) => {
  // handle cascade effect properlys
  // log the original error
  if (err.childErrors.length > 0) {
    logger.error('Origin Errors');
    err.childErrors.forEach(e => logger.error(e));
  }
  // log the display error
  logger.error(`${flow ? flow : ''}: ${err.showError()}`);
  return err;
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

const handleDeviceErrors = (
  cyError: CyError,
  err: any,
  langStrings: I18nStrings,
  flow: string
) => {
  cyError.pushSubErrors(err.code, err.message);
  if (
    [
      DeviceErrorType.CONNECTION_CLOSED,
      DeviceErrorType.CONNECTION_NOT_OPEN
    ].includes(err.errorType)
  ) {
    cyError.setError(
      DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW,
      langStrings.ERRORS.DEVICE_DISCONNECTED_IN_FLOW
    );
  } else if (err.errorType === DeviceErrorType.NOT_CONNECTED) {
    cyError.setError(
      DeviceErrorType.NOT_CONNECTED,
      langStrings.ERRORS.DEVICE_NOT_CONNECTED
    );
  } else if (
    [DeviceErrorType.WRITE_TIMEOUT, DeviceErrorType.READ_TIMEOUT].includes(
      err.errorType
    )
  ) {
    cyError.setError(
      DeviceErrorType.TIMEOUT_ERROR,
      langStrings.ERRORS.DEVICE_TIMEOUT_ERROR
    );
  } else {
    cyError.setError(
      DeviceErrorType.UNKNOWN_COMMUNICATION_ERROR,
      langStrings.ERRORS.UNKNOWN_FLOW_ERROR(flow)
    );
  }
};

export { handleErrors, handleDeviceErrors };
