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
  if (metadata) {
    logger.info('Metadata for the error');
    logger.info(metadata);
  }

  // report to analytics
  Analytics.Instance.event(flow, Analytics.Actions.ERROR);

  return err;
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
      langStrings.ERRORS.UNKNOWN_COMMUNICATION_ERROR(flow)
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

export const getMap = (langStrings: I18nStrings): CodeToErrorMap => {
  return {
    [DeviceErrorType.CONNECTION_CLOSED]: {
      parent: DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW,
      message: 'Device connection closed'
    },
    [DeviceErrorType.CONNECTION_NOT_OPEN]: {
      parent: DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW,
      message: 'Device connection not open'
    },
    [DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW]: {
      message: langStrings.ERRORS.DEVICE_DISCONNECTED_IN_FLOW
    },
    DS_CONN_3001: undefined,
    DS_CONN_3002: undefined,
    DS_CONN_2001: undefined,
    HD_SEC_0001: undefined,
    HD_UACT_1504: undefined,
    DS_MISC_5505: undefined,
    HD_UACT_1505: undefined,
    HD_FIRM_5001: undefined,
    HD_FIRM_5002: undefined,
    HD_FIRM_5501: undefined,
    DS_MISC_5506: undefined,
    HD_COM_1001: undefined,
    HD_COM_1002: undefined,
    DS_MISC_5504: undefined,
    HD_UACT_1501: undefined,
    HD_OPS_1001: undefined,
    HD_OPS_1002: undefined,
    HD_OPS_1005: undefined,
    HD_OPS_1006: undefined,
    HD_OPS_1007: undefined,
    HD_OPS_1008: undefined,
    DS_MISC_5508: undefined,
    HD_OPS_1011: undefined,
    HD_OPS_1004: undefined,
    HD_OPS_1003: undefined,
    CRD_SEC_1001: undefined,
    HD_OPS_1010: undefined,
    HD_UACT_1502: undefined,
    HD_OPS_5250: undefined,
    HD_OPS_5251: undefined,
    HD_OPS_5252: undefined,
    HD_OPS_1501: undefined,
    DS_MISC_5509: undefined,
    CRD_SEC_5500: undefined,
    DS_MISC_5507: undefined,
    DS_OPTS_1001: undefined,
    HD_UACT_1510: undefined,
    HD_UACT_1511: undefined,
    HD_UACT_1512: undefined,
    HD_UACT_1513: undefined,
    HD_UACT_1519: undefined,
    DS_OPTS_1005: undefined,
    DS_OPTS_1007: undefined,
    DS_OPTS_1003: undefined,
    DS_OPTS_1002: undefined,
    DS_MISC_5501: undefined,
    HD_OPS_1502: undefined,
    DS_OPTS_2500: undefined,
    DS_OPTS_1510: undefined,
    DS_OPTS_1511: undefined,
    DS_OPTS_1507: undefined,
    DS_MISC_5502: undefined,
    HD_INIT_2100: undefined,
    HD_INIT_2101: undefined,
    HD_INIT_2102: undefined,
    HD_INIT_2103: undefined,
    HD_INIT_2104: undefined,
    HD_INIT_2106: undefined,
    HD_INIT_5501: undefined,
    SYS_VER_1011: undefined,
    SYS_VER_1012: undefined,
    SYS_VER_1013: undefined,
    HD_MISC_2001: undefined,
    HD_UACT_1506: undefined,
    HD_MISC_1002: undefined,
    HD_MISC_1001: undefined,
    HD_UACT_1503: undefined,
    CRD_SEC_1005: undefined,
    CRD_SEC_1004: undefined,
    DS_SYNC_1001: undefined,
    DS_SYNC_3001: undefined,
    DS_SYNC_5501: undefined,
    DS_SYNC_5502: undefined,
    DS_SYNC_5503: undefined,
    DS_SYNC_1002: undefined,
    DS_MISC_5503: undefined,
    HD_INIT_1001: undefined,
    HD_COM_1007: undefined,
    HD_COM_1050: undefined,
    HD_COM_1051: undefined,
    HD_COM_1052: undefined,
    HD_FIRM_1001: undefined,
    HD_FIRM_1002: undefined,
    HD_FIRM_1003: undefined,
    HD_FIRM_1004: undefined,
    HD_FIRM_1005: undefined,
    HD_FIRM_1006: undefined,
    HD_INIT_2006: undefined,
    HD_COM_5500: undefined,
    HD_COM_5001: undefined,
    HD_COM_5002: undefined,
    DS_OPTS_1011: undefined,
    DS_OPTS_1010: undefined
  };
};

export {
  handleErrors,
  handleDeviceErrors,
  handleAxiosErrors,
  handleWalletErrors
};
