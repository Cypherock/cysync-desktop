import { DeviceErrorType } from '@cypherock/communication';
import { WalletErrorType } from '@cypherock/wallet';

export enum CysyncError {
  NETWORK_ERROR = 'DS_CONN_3001',
  NETWORK_FAILURE = 'DS_CONN_3002',
  NETWORK_UNREACHABLE = 'DS_CONN_2001',

  DEVICE_AUTH_FAILED = 'HD_SEC_0001',
  DEVICE_AUTH_REJECTED = 'HD_UACT_1504',
  DEVICE_AUTH_UNKNOWN_ERROR = 'DS_MISC_5505',

  DEVICE_UPGRADE_REJECTED = 'HD_UACT_1505',
  DEVICE_UPGRADE_FIRMWARE_DOWNLOAD_FAILED = 'HD_FIRM_5001',
  DEVICE_UPGRADE_FAILED = 'HD_FIRM_5002',
  DEVICE_UPGRADE_CONNECTION_FAILED_IN_AUTH = 'HD_FIRM_5501',
  DEVICE_UPGRADE_UNKNOWN_ERROR = 'DS_MISC_5506',

  DEVICE_NOT_READY = 'HD_COM_1001',
  DEVICE_NOT_READY_IN_INITIAL = 'HD_COM_1002',
  DEVICE_INFO_UNKNOWN_ERROR = 'DS_MISC_5504',

  ADD_WALLET_REJECTED = 'HD_UACT_1501',
  NO_WALLET_ON_DEVICE = 'HD_OPS_1001',
  ALL_WALLET_PARTIAL_STATE = 'HD_OPS_1002',
  ADD_WALLET_LIMIT_EXCEEDED = 'HD_OPS_1005',
  ADD_WALLET_DUPLICATE = 'HD_OPS_1006',
  ADD_WALLET_DUPLICATE_WITH_DIFFERENT_NAME = 'HD_OPS_1007',
  ADD_WALLET_WITH_SAME_NAME = 'HD_OPS_1008',
  ADD_WALLET_UNKNOWN_ERROR = 'DS_MISC_5508',

  WALLET_LOCKED_DUE_TO_INCORRECT_PIN = 'HD_OPS_1011',
  WALLET_PARTIAL_STATE = 'HD_OPS_1004',
  WALLET_NOT_FOUND_IN_DEVICE = 'HD_OPS_1003',
  WALLET_NOT_FOUND_IN_CARD = 'CRD_SEC_1001',
  WALLET_IS_LOCKED = 'HD_OPS_1010',

  ADD_COIN_REJECTED = 'HD_UACT_1502',
  ADD_COIN_FAILED = 'HD_OPS_5250',
  ADD_COIN_FAILED_DUE_TO_SERVER_ERROR = 'HD_OPS_5251',
  ADD_COIN_FAILED_INTERNAL_ERROR = 'HD_OPS_5252',
  ADD_COIN_UNKNOWN_ASSET = 'HD_OPS_1501',
  ADD_COIN_UNKNOWN_ERROR = 'DS_MISC_5509',

  UNKNOWN_CARD_ERROR = 'CRD_SEC_5500',
  CARD_AUTH_UNKNOWN_ERROR = 'DS_MISC_5507',

  SEND_TXN_SIZE_TOO_LARGE = 'DS_OPTS_1001',
  SEND_TXN_REJECTED = 'HD_UACT_1510',
  SEND_TXN_REJECTED_AT_ADDRESS = 'HD_UACT_1511',
  SEND_TXN_REJECTED_AT_AMOUNT = 'HD_UACT_1512',
  SEND_TXN_REJECTED_AT_FEE = 'HD_UACT_1513',
  SEND_TXN_REJECTED_AT_UNKNOWN = 'HD_UACT_1519',
  SEND_TXN_SIGNED_TXN_NOT_FOUND = 'DS_OPTS_1005',
  SEND_TXN_CANCEL_FAILED = 'DS_OPTS_1007',
  SEND_TXN_BROADCAST_FAILED = 'DS_OPTS_1003',
  SEND_TXN_VERIFICATION_FAILED = 'DS_OPTS_1002',
  SEND_TXN_UNKNOWN_ERROR = 'DS_MISC_5501',

  RECEIVE_TXN_XPUB_MISSING = 'HD_OPS_1502',
  RECEIVE_TXN_DEVICE_MISCONFIGURED = 'DS_OPTS_2500',
  RECEIVE_TXN_DIFFERENT_ADDRESS_FROM_DEVICE = 'DS_OPTS_1510',
  RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER = 'DS_OPTS_1511',
  RECEIVE_TXN_CANCEL_FAILED = 'DS_OPTS_1507',
  RECEIVE_TXN_UNKNOWN_ERROR = 'DS_MISC_5502',

  DEVICE_HAS_INITIAL_FIRMWARE = 'HD_INIT_2100',
  DEVICE_IN_BOOTLOADER = 'HD_INIT_2101',
  LAST_DEVICE_AUTH_FAILED = 'HD_INIT_2102',
  UNAUTHENTICATED_DEVICE = 'HD_INIT_2103',
  NEW_DEVICE_CONNECTED = 'HD_INIT_2104',
  DEVICE_IN_TEST_APP = 'HD_INIT_2106',
  DEVICE_IN_PARTIAL_STATE = 'HD_INIT_2106',
  UNKNOWN_CONNECTION_ERROR = 'HD_INIT_5501',
  INCOMPATIBLE_DEVICE = 'SYS_VER_1011',
  INCOMPATIBLE_DESKTOP = 'SYS_VER_1012',
  INCOMPATIBLE_DEVICE_AND_DESKTOP = 'SYS_VER_1013',

  LOG_FETCHER_DISABLED_ON_DEVICE = 'HD_MISC_2001',
  LOG_FETCHER_REJECTED = 'HD_UACT_1506',
  LOG_FETCHING_CANCEL_FAILED = 'HD_MISC_1002',
  LOG_FETCHER_UNKNOWN_ERROR = 'HD_MISC_1001',

  CARD_AUTH_REJECTED = 'HD_UACT_1503',
  CARD_AUTH_FAILED = 'CRD_SEC_1005',
  CARD_PAIRING_FAILED = 'CRD_SEC_1004',

  TXN_INSERT_FAILED = 'DS_SYNC_1001',
  TXN_INVALID_RESPONSE = 'DS_SYNC_3001',
  LATEST_PRICE_REFRESH_FAILED = 'DS_SYNC_5501',
  HISTORY_REFRESH_FAILED = 'DS_SYNC_5502',
  NOTIFICATIONS_REFRESH_FAILED = 'DS_SYNC_5503',
  PRICE_REFRESH_FAILED = 'DS_SYNC_5501',
  SYNC_MAX_TRIES_EXCEEDED = 'DS_SYNC_1002',
  TUTORIALS_UNKNOWN_ERROR = 'DS_MISC_5503'
}
export type ErrorsSet = CysyncError | DeviceErrorType | WalletErrorType;
interface ErrorObject {
  parent?: ErrorsSet;
  message: string;
}
export type CodeToErrorMap = {
  [key in ErrorsSet]-?: ErrorObject;
};
