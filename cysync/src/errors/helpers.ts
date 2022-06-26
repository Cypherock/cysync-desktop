import logger from '../utils/logger';

import { CyError } from './error';

const handleErrors = (
  currError: CyError,
  err: CyError,
  flow?: string,
  metadata?: any
) => {
  // handle cascade effect properly
  if (!currError.isSet)
    currError.pushSubErrors(err.getCode(), err.getMessage());

  // if (currError.getCode() === DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW)
  //   err.pushSubErrors(currError.getCode(), currError.getMessage());

  return err;
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

export { handleErrors };
