import { DeviceErrorType } from '@cypherock/communication';
import { WalletErrorType } from '@cypherock/wallet';

import { I18nStrings } from '../constants/i18n';
import Analytics from '../utils/analytics';
import logger from '../utils/logger';

import { CyError } from './error';
import { CysyncError } from './types';

const handleErrors = (
  currError: CyError,
  err: CyError,
  flow?: string,
  metadata?: any
) => {
  //TODO:  handle cascade effect properly
  logger.info(currError);

  // log the original error
  if (err.childErrors.length > 0) {
    logger.error('Origin Errors');
    err.childErrors.forEach(e => logger.error(e));
  }
  // log the display error
  logger.error(`${flow ? flow : ''}: ${err.showError()}`);

  // logging the metadata
  logger.info(metadata);

  // report to analytics
  Analytics.Instance.event(flow, Analytics.Actions.ERROR);

  return err;
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

const handleAxiosErrors = (
  cyError: CyError,
  error: any,
  langStrings: I18nStrings
) => {
  if (error && error.response) {
    cyError.setError(
      CysyncError.NETWORK_FAILURE,
      langStrings.ERRORS.NETWORK_ERROR
    );
  } else {
    cyError.setError(
      CysyncError.NETWORK_UNREACHABLE,
      langStrings.ERRORS.NETWORK_UNREACHABLE
    );
  }
};

const handleWalletErrors = (
  cyError: CyError,
  error: any,
  langStrings: I18nStrings,
  metadata: {
    coinType: string;
  }
) => {
  if (error.errorType === WalletErrorType.SUFFICIENT_CONFIRMED_BALANCE)
    cyError.setError(
      WalletErrorType.SUFFICIENT_CONFIRMED_BALANCE,
      langStrings.ERRORS.SEND_TXN_SUFFICIENT_CONFIRMED_BALANCE
    );
  else if (error.errorType === WalletErrorType.INSUFFICIENT_FUNDS)
    cyError.setError(
      WalletErrorType.INSUFFICIENT_FUNDS,
      langStrings.ERRORS.SEND_TXN_INSUFFICIENT_BALANCE(metadata.coinType)
    );
};

// const handleUnknownFlowErrors;
// const;

export {
  handleErrors,
  handleDeviceErrors,
  handleAxiosErrors,
  handleWalletErrors
};
