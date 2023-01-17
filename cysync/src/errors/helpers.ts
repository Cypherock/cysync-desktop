import { DeviceErrorType } from '@cypherock/communication';
import { FlowErrorType } from '@cypherock/protocols';
import { WalletErrorType } from '@cypherock/wallet';

import { I18nStrings } from '../constants/i18n';
import Analytics from '../utils/analytics';
import logger from '../utils/logger';

import { CyError } from './error';
import { CodeToErrorMap, CysyncError } from './types';

const isUnknownError = (code: string) => {
  return /^([A-Z]{2}_[A-Z]{3,4}_55[0-9]{2})$/.test(code);
};

const handleErrors = (
  currError: CyError,
  err: CyError,
  flow?: string,
  metadata?: any
): CyError => {
  //TODO:  handle cascade effect properly
  if (currError?.isSet) {
    // Drop the incoming Unknown Error if there is already a specific error set.
    // Do not set the same error again as it serves no purpose.
    if (isUnknownError(err.getCode()) || currError.isEqualTo(err))
      return currError;
    logger.info(currError);
  }

  // log the original error
  if (err.childErrors.length > 0) {
    logger.error('Origin Errors');
    err.childErrors.forEach(e => logger.error(e));
  }
  // log the display error
  logger.info('Incoming Error');
  logger.error(`${flow ? flow : ''}: ${err.showError()}`);

  // logging the metadata
  if (metadata) {
    logger.info('Metadata for the error');
    if (typeof metadata === 'object') {
      Object.keys(metadata).forEach(key => {
        logger.info(`Metadata key: ${key}`, metadata[key]);
      });
    } else {
      logger.info(metadata);
    }
  }

  //USB Modem Device Disconnection Unknown error
  if (
    isUnknownError(err.getCode()) &&
    metadata?.err?.message &&
    (metadata?.err?.message.match('cannot open /dev/tty.usbmodem') ||
      metadata?.err?.message.match('Writing to COM port'))
  )
    err.setError(DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW);

  // report to analytics
  Analytics.Instance.event(flow, Analytics.Actions.ERROR);

  return err;
};

const handleFirmwareUpdateErrors = (cyError: CyError, err: any) => {
  cyError.pushSubErrors(err.code);
};

const handleDeviceErrors = (cyError: CyError, err: any, flow: string) => {
  cyError.pushSubErrors(err.code);
  if (
    [
      DeviceErrorType.CONNECTION_CLOSED,
      DeviceErrorType.CONNECTION_NOT_OPEN
    ].includes(err.errorType)
  ) {
    cyError.setError(DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW);
  } else if (err.errorType === DeviceErrorType.NOT_CONNECTED) {
    cyError.setError(DeviceErrorType.NOT_CONNECTED);
  } else if (
    [DeviceErrorType.WRITE_TIMEOUT, DeviceErrorType.READ_TIMEOUT].includes(
      err.errorType
    )
  ) {
    cyError.setError(DeviceErrorType.TIMEOUT_ERROR);
  } else if (DeviceErrorType.NOT_IN_RECEIVING_MODE === err.errorType) {
    cyError.setError(DeviceErrorType.NOT_IN_RECEIVING_MODE, flow);
  } else if (
    [
      DeviceErrorType.FIRMWARE_SIZE_LIMIT_EXCEEDED,
      DeviceErrorType.WRONG_HARDWARE_VERSION,
      DeviceErrorType.WRONG_MAGIC_NUMBER,
      DeviceErrorType.SIGNATURE_NOT_VERIFIED,
      DeviceErrorType.LOWER_FIRMWARE_VERSION
    ].includes(err.errorType)
  ) {
    cyError.setError(CysyncError.DEVICE_UPGRADE_KNOWN_ERROR);
  } else if (DeviceErrorType.PROCESS_ABORTED_BY_USER === err.errorType) {
    cyError.setError(DeviceErrorType.PROCESS_ABORTED_BY_USER, flow);
  } else if (DeviceErrorType.DEVICE_ABORT === err.errorType) {
    cyError.setError(DeviceErrorType.DEVICE_ABORT, flow);
  } else {
    cyError.setError(DeviceErrorType.UNKNOWN_COMMUNICATION_ERROR, flow);
  }
};

const handleAxiosErrors = (cyError: CyError, error: any) => {
  if (error && error.response) {
    cyError.setError(CysyncError.NETWORK_FAILURE);
  } else {
    cyError.setError(CysyncError.NETWORK_UNREACHABLE);
  }
};

const handleWalletErrors = (
  cyError: CyError,
  error: any,
  metadata: {
    coinId: string;
  }
) => {
  if (error.errorType === WalletErrorType.BLOCKED_UTXOS_WITH_SUFFICIENT_BALANCE)
    cyError.setError(WalletErrorType.BLOCKED_UTXOS_WITH_SUFFICIENT_BALANCE);
  else if (error.errorType === WalletErrorType.INSUFFICIENT_FUNDS)
    cyError.setError(WalletErrorType.INSUFFICIENT_FUNDS, metadata.coinId);
};

export const getMap = (langStrings: I18nStrings): CodeToErrorMap => {
  return {
    [DeviceErrorType.SWAP_TXN_UNKNOWN_ERROR]: {
      parent: CysyncError.SWAP_TXN_UNKNOWN_ERROR,
      message: 'Swap Transaction Unknown Error'
    },
    [DeviceErrorType.CONNECTION_CLOSED]: {
      parent: DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW,
      message: 'Device connection closed'
    },
    [DeviceErrorType.CONNECTION_NOT_OPEN]: {
      parent: DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW,
      message: 'Device connection not open'
    },
    [DeviceErrorType.NOT_IN_RECEIVING_MODE]: {
      message: langStrings.ERRORS.DEVICE_NOT_IN_UPDATE_RECEIVING_MODE
    },
    [DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW]: {
      message: langStrings.ERRORS.DEVICE_DISCONNECTED_IN_FLOW
    },
    [DeviceErrorType.NOT_CONNECTED]: {
      message: langStrings.ERRORS.DEVICE_NOT_CONNECTED
    },

    [CysyncError.NETWORK_FAILURE]: {
      message: langStrings.ERRORS.NETWORK_FAILURE
    },
    [CysyncError.NETWORK_UNREACHABLE]: {
      message: langStrings.ERRORS.NETWORK_UNREACHABLE
    },

    [CysyncError.DEVICE_AUTH_FAILED]: {
      message: langStrings.ERRORS.DEVICE_AUTH_FAILED
    },
    [CysyncError.DEVICE_AUTH_REJECTED]: {
      message: langStrings.ERRORS.DEVICE_AUTH_REJECTED
    },
    [CysyncError.DEVICE_AUTH_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.DEVICE_AUTH_UNKNOWN_ERROR
    },

    [CysyncError.DEVICE_UPGRADE_REJECTED]: {
      message: langStrings.ERRORS.DEVICE_UPGRADE_REJECTED
    },
    [CysyncError.DEVICE_UPGRADE_FIRMWARE_DOWNLOAD_FAILED]: {
      message: langStrings.ERRORS.DEVICE_UPGRADE_FIRMWARE_DOWNLOAD_FAILED
    },
    [CysyncError.DEVICE_UPGRADE_FAILED]: {
      message: langStrings.ERRORS.DEVICE_UPGRADE_FAILED
    },
    [CysyncError.DEVICE_UPGRADE_CONNECTION_FAILED_IN_AUTH]: {
      message: langStrings.ERRORS.DEVICE_UPGRADE_CONNECTION_FAILED_IN_AUTH
    },
    [CysyncError.DEVICE_UPGRADE_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.DEVICE_UPGRADE_UNKNOWN_ERROR
    },
    [CysyncError.DEVICE_UPGRADE_KNOWN_ERROR]: {
      message: langStrings.ERRORS.DEVICE_UPGRADE_KNOWN_ERROR
    },

    [CysyncError.DEVICE_NOT_READY]: {
      message: langStrings.ERRORS.DEVICE_NOT_READY
    },
    [CysyncError.DEVICE_NOT_READY_IN_INITIAL]: {
      message: langStrings.ERRORS.DEVICE_NOT_READY_IN_INITIAL
    },
    [CysyncError.DEVICE_INFO_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.DEVICE_INFO_UNKNOWN_ERROR
    },
    [CysyncError.ADD_WALLET_REJECTED]: {
      message: langStrings.ERRORS.ADD_WALLET_REJECTED
    },
    [CysyncError.NO_WALLET_ON_DEVICE]: {
      message: langStrings.ERRORS.NO_WALLET_ON_DEVICE
    },
    [CysyncError.NO_VALID_WALLET_FOUND]: {
      message: langStrings.ERRORS.NO_VALID_WALLET_FOUND
    },
    [CysyncError.ADD_WALLET_LIMIT_EXCEEDED]: {
      message: langStrings.ERRORS.ADD_WALLET_LIMIT_EXCEEDED
    },
    [CysyncError.ADD_WALLET_DUPLICATE]: {
      message: langStrings.ERRORS.ADD_WALLET_DUPLICATE
    },
    [CysyncError.ADD_WALLET_DUPLICATE_WITH_DIFFERENT_DETAILS]: {
      message: langStrings.ERRORS.ADD_WALLET_DUPLICATE_WITH_DIFFERENT_DETAILS
    },
    [CysyncError.ADD_WALLET_WITH_SAME_NAME]: {
      message: langStrings.ERRORS.ADD_WALLET_WITH_SAME_NAME
    },
    [CysyncError.ADD_WALLET_DUPLICATE_WITH_DIFFERENT_PASSPHRASE_CONFIG]: {
      message:
        langStrings.ERRORS.ADD_WALLET_DUPLICATE_WITH_DIFFERENT_PASSPHRASE_CONFIG
    },
    [CysyncError.ADD_WALLET_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.ADD_WALLET_UNKNOWN_ERROR
    },
    [CysyncError.WALLET_LOCKED_DUE_TO_INCORRECT_PIN]: {
      message: langStrings.ERRORS.WALLET_LOCKED_DUE_TO_INCORRECT_PIN
    },
    [CysyncError.WALLET_PARTIAL_STATE]: {
      message: langStrings.ERRORS.WALLET_PARTIAL_STATE
    },
    [CysyncError.WALLET_NOT_FOUND_IN_DEVICE]: {
      message: langStrings.ERRORS.WALLET_NOT_FOUND_IN_DEVICE
    },
    [CysyncError.WALLET_NOT_FOUND_IN_CARD]: {
      message: langStrings.ERRORS.WALLET_NOT_FOUND_IN_CARD
    },
    [CysyncError.WALLET_IS_LOCKED]: {
      message: langStrings.ERRORS.WALLET_IS_LOCKED
    },
    [CysyncError.WALLET_UNKNOWN_STATE]: {
      message: langStrings.ERRORS.WALLET_UNKNOWN_STATE
    },

    [CysyncError.ADD_COIN_REJECTED]: {
      message: langStrings.ERRORS.ADD_COIN_REJECTED
    },
    [CysyncError.ADD_COIN_FAILED]: {
      message: (coin: string) => langStrings.ERRORS.ADD_COIN_FAILED(coin)
    },
    [CysyncError.ADD_COIN_FAILED_DUE_TO_SERVER_ERROR]: {
      message: (coin: string) =>
        langStrings.ERRORS.ADD_COIN_FAILED_DUE_TO_SERVER_ERROR(coin)
    },
    [CysyncError.ADD_COIN_FAILED_INTERNAL_ERROR]: {
      message: (coin: string) =>
        langStrings.ERRORS.ADD_COIN_FAILED_INTERNAL_ERROR(coin)
    },
    [CysyncError.ADD_COIN_UNKNOWN_ASSET]: {
      message: 'Unknown account requested to the device',
      parent: CysyncError.ADD_COIN_UNKNOWN_ASSET
    },
    [CysyncError.ADD_COIN_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.ADD_COIN_UNKNOWN_ERROR
    },
    [CysyncError.UNKNOWN_CARD_ERROR]: {
      message: langStrings.ERRORS.UNKNOWN_CARD_ERROR
    },
    [CysyncError.CARD_AUTH_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.CARD_AUTH_UNKNOWN_ERROR
    },
    [CysyncError.SEND_TXN_SIZE_TOO_LARGE]: {
      message: langStrings.ERRORS.SEND_TXN_SIZE_TOO_LARGE
    },
    [CysyncError.SEND_TXN_REJECTED]: {
      message: (coin: string) => langStrings.ERRORS.SEND_TXN_REJECTED(coin)
    },
    [CysyncError.SEND_TXN_REJECTED_AT_ADDRESS]: {
      message: 'SendTransaction: Txn was rejected on address screen',
      parent: CysyncError.SEND_TXN_REJECTED
    },
    [CysyncError.SEND_TXN_REJECTED_AT_AMOUNT]: {
      message: 'SendTransaction: Txn was rejected on address screen',
      parent: CysyncError.SEND_TXN_REJECTED
    },
    [CysyncError.SEND_TXN_REJECTED_AT_FEE]: {
      message: 'SendTransaction: Txn was rejected on address screen',
      parent: CysyncError.SEND_TXN_REJECTED
    },
    [CysyncError.SEND_TXN_REJECTED_AT_UNKNOWN]: {
      message: 'SendTransaction: Txn was rejected on address screen',
      parent: CysyncError.SEND_TXN_REJECTED
    },
    [CysyncError.SEND_TXN_SIGNED_TXN_NOT_FOUND]: {
      message: 'Signed Transaction was not found',
      parent: CysyncError.SEND_TXN_UNKNOWN_ERROR
    },
    [CysyncError.SEND_TXN_CANCEL_FAILED]: {
      message: ''
    },
    [CysyncError.SEND_TXN_BROADCAST_FAILED]: {
      message: langStrings.ERRORS.SEND_TXN_BROADCAST_FAILED
    },
    [CysyncError.SEND_TXN_VERIFICATION_FAILED]: {
      message: ''
    },
    [CysyncError.SEND_TXN_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.SEND_TXN_UNKNOWN_ERROR
    },
    [CysyncError.RECEIVE_TXN_REJECTED]: {
      message: (coin: string) => langStrings.ERRORS.RECEIVE_TXN_REJECTED(coin)
    },
    [CysyncError.RECEIVE_TXN_XPUB_MISSING]: {
      message: langStrings.ERRORS.RECEIVE_TXN_XPUB_MISSING
    },
    [CysyncError.RECEIVE_TXN_DEVICE_MISCONFIGURED]: {
      message: langStrings.ERRORS.RECEIVE_TXN_DEVICE_MISCONFIGURED
    },
    [CysyncError.RECEIVE_TXN_GENERATE_UNVERIFIED_FAILED]: {
      message: langStrings.ERRORS.RECEIVE_TXN_GENERATE_UNVERIFIED_FAILED
    },
    [CysyncError.RECEIVE_TXN_DIFFERENT_ADDRESS_FROM_DEVICE]: {
      message: langStrings.ERRORS.RECEIVE_TXN_DIFFERENT_ADDRESS_FROM_DEVICE
    },
    [CysyncError.RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER]: {
      message: langStrings.ERRORS.RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER
    },
    [CysyncError.RECEIVE_TXN_CANCEL_FAILED]: {
      message: ''
    },
    [CysyncError.RECEIVE_TXN_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.RECEIVE_TXN_UNKNOWN_ERROR
    },
    // Status Codes
    [CysyncError.DEVICE_HAS_INITIAL_FIRMWARE]: undefined,
    [CysyncError.DEVICE_IN_BOOTLOADER]: {
      message: langStrings.ERRORS.DEVICE_MISCONFIGURED
    },
    [CysyncError.LAST_DEVICE_AUTH_FAILED]: undefined,
    [CysyncError.UNAUTHENTICATED_DEVICE]: undefined,
    [CysyncError.NEW_DEVICE_CONNECTED]: undefined,
    [CysyncError.DEVICE_IN_TEST_APP]: {
      message: langStrings.ERRORS.DEVICE_MISCONFIGURED
    },
    [CysyncError.DEVICE_IN_PARTIAL_STATE]: undefined,
    [CysyncError.UNKNOWN_CONNECTION_ERROR]: undefined,
    [CysyncError.INCOMPATIBLE_DEVICE]: undefined,
    [CysyncError.INCOMPATIBLE_DESKTOP]: undefined,
    [CysyncError.INCOMPATIBLE_DEVICE_AND_DESKTOP]: undefined,

    [CysyncError.LOG_FETCHER_DISABLED_ON_DEVICE]: {
      message: langStrings.ERRORS.LOG_FETCHER_DISABLED_ON_DEVICE
    },
    [CysyncError.LOG_FETCHER_REJECTED]: {
      message: langStrings.ERRORS.LOG_FETCHER_REJECTED
    },
    [CysyncError.LOG_FETCHING_CANCEL_FAILED]: {
      message: langStrings.ERRORS.LOG_FETCHING_CANCEL_FAILED
    },
    [CysyncError.LOG_FETCHER_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.LOG_FETCHER_UNKNOWN_ERROR
    },

    [CysyncError.CARD_AUTH_REJECTED]: {
      message: langStrings.ERRORS.CARD_AUTH_REJECTED
    },
    [CysyncError.CARD_AUTH_FAILED]: {
      message: langStrings.ERRORS.CARD_AUTH_FAILED
    },
    [CysyncError.CARD_PAIRING_FAILED]: {
      message: langStrings.ERRORS.CARD_AUTH_DEVICE_PAIRING_FAILED
    },

    [CysyncError.TXN_INSERT_FAILED]: {
      message: ''
    },
    [CysyncError.TXN_INVALID_RESPONSE]: {
      message: ''
    },
    [CysyncError.LATEST_PRICE_REFRESH_FAILED]: {
      message: ''
    },
    [CysyncError.HISTORY_REFRESH_FAILED]: {
      message: ''
    },
    [CysyncError.NOTIFICATIONS_REFRESH_FAILED]: {
      message: ''
    },

    [CysyncError.SYNC_MAX_TRIES_EXCEEDED]: {
      message: ''
    },
    [CysyncError.TUTORIALS_UNKNOWN_ERROR]: {
      message: langStrings.ERRORS.TUTORIALS_UNKNOWN_ERROR
    },

    [DeviceErrorType.WRITE_ERROR]: {
      message: 'Unable to write packet to the device'
    },
    [DeviceErrorType.TIMEOUT_ERROR]: {
      message: 'Timeout Error due to write/read'
    },
    [DeviceErrorType.WRITE_TIMEOUT]: {
      message: 'Did not receive ACK of sent packet on time'
    },
    [DeviceErrorType.READ_TIMEOUT]: {
      message: 'Did not receive the expected data from device on time'
    },
    [DeviceErrorType.FIRMWARE_SIZE_LIMIT_EXCEEDED]: {
      message: 'Firmware Size Limit Exceed'
    },
    [DeviceErrorType.WRONG_HARDWARE_VERSION]: {
      message: 'Wrong Hardware version'
    },
    [DeviceErrorType.WRONG_MAGIC_NUMBER]: {
      message: 'Wrong Magic Number'
    },
    [DeviceErrorType.SIGNATURE_NOT_VERIFIED]: {
      message: 'Signature not verified'
    },
    [DeviceErrorType.LOWER_FIRMWARE_VERSION]: {
      message: 'Lower Firmware Version'
    },
    [DeviceErrorType.NO_WORKING_PACKET_VERSION]: {
      message: 'No working packet version'
    },
    [DeviceErrorType.UNKNOWN_COMMUNICATION_ERROR]: {
      message: 'Unknown Error at communication module'
    },
    [DeviceErrorType.WRITE_REJECTED]: {
      message: 'The write packet operation was rejected by the device'
    },
    [DeviceErrorType.FLASH_WRITE_ERROR]: {
      message: 'Flash Write Error'
    },
    [DeviceErrorType.FLASH_CRC_MISMATCH]: {
      message: 'Flash CRC Mismatch'
    },
    [DeviceErrorType.FLASH_TIMEOUT_ERROR]: {
      message: 'Flash Timeout Error'
    },
    [DeviceErrorType.FLASH_NACK]: {
      message: 'Flash Negative Acknowledgement'
    },
    [DeviceErrorType.EXECUTING_OTHER_COMMAND]: {
      message: 'The device is executing some other command'
    },
    [WalletErrorType.BLOCKED_UTXOS_WITH_SUFFICIENT_BALANCE]: {
      message: langStrings.ERRORS.SEND_TXN_BLOCKED_UTXOS_WITH_SUFFICIENT_BALANCE
    },
    [DeviceErrorType.DEVICE_ABORT]: {
      message: 'The request was timed out on the device'
    },
    [WalletErrorType.INSUFFICIENT_FUNDS]: {
      message: (coin: string) =>
        langStrings.ERRORS.SEND_TXN_INSUFFICIENT_BALANCE(coin)
    },
    [FlowErrorType.UNKNOWN_FLOW_ERROR]: {
      message: 'Unknown Flow error at Protocols'
    },
    [WalletErrorType.INACCESSIBLE_ACCOUNT]: {
      message: 'Acccount is not accessible with wallet'
    },
    [CysyncError.STOP_ONGOING_FLOW]: {
      message: langStrings.ERRORS.STOP_ONGOING_FLOW
    },
    [DeviceErrorType.PROCESS_ABORTED_BY_USER]: {
      message: (flow: string) =>
        langStrings.ERRORS.PROCESS_ABORTED_BY_USER(flow)
    }
  };
};

export {
  handleErrors,
  handleDeviceErrors,
  handleAxiosErrors,
  handleWalletErrors,
  handleFirmwareUpdateErrors
};
