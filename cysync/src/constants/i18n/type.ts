export interface ErrorObject {
  code: string;
  message: string;
}

export interface I18nStrings {
  ERRORS: {
    UNKNOWN_FLOW_ERROR: ErrorObject;
    UNKNOWN_INTERNAL_ERROR: (msg: string) => ErrorObject;

    NETWORK_UNREACHABLE: ErrorObject;
    NETWORK_ERROR: ErrorObject;
    NETWORK_FAILURE: ErrorObject;

    DEVICE_NOT_CONNECTED: ErrorObject;
    DEVICE_DISCONNECTED_IN_FLOW: ErrorObject;
    DEVICE_READ_TIMEOUT: ErrorObject;
    DEVICE_WRITE_TIMEOUT: ErrorObject;
    DEVICE_NOT_READY: ErrorObject;
    DEVICE_NOT_READY_IN_INITIAL: ErrorObject;
    DEVICE_NOT_SUPPORTED: string;

    WALLET_NOT_FOUND: ErrorObject;
    WALLET_NOT_ON_CARD: string;
    WALLET_PARTIAL_STATE: ErrorObject;
    ALL_WALLET_PARTIAL_STATE: string;
    NO_WALLET_ON_DEVICE: string;
    WALLET_LOCKED: ErrorObject;
    WALLET_LOCKED_DUE_TO_INCORRECT_PIN: ErrorObject;

    ADD_WALLET_REJECTED: string;
    ADD_WALLET_LIMIT_EXCEEDED: string;
    ADD_WALLET_DUPLICATE: string;
    ADD_WALLET_DUPLICATE_WITH_DIFFERENT_NAME: string;
    ADD_WALLET_WITH_SAME_NAME: string;

    ADD_COIN_FAILED_DUE_TO_SERVER_ERROR: (coins: string) => string;
    ADD_COIN_FAILED_INTERNAL_ERROR: (coins: string) => string;
    ADD_COIN_FAILED: (coins: string) => string;
    ADD_COIN_REJECTED: string;

    CARD_AUTH_REJECTED: string;
    CARD_AUTH_FAILED: string;
    CARD_AUTH_DEVICE_PAIRING_FAILED: string;

    DEVICE_AUTH_REJECTED: string;
    DEVICE_AUTH_FAILED: string;

    DEVICE_UPGRADE_REJECTED: string;
    DEVICE_UPGRADE_FAILED: string;
    DEVICE_UPGRADE_FIRMWARE_DOWNLOAD_FAILED: string;
    DEVICE_UPGRADE_CONNECTION_FAILED_IN_AUTH: string;

    LOG_FETCHER_REJECTED: string;
    LOG_FETCHER_DISABLED_ON_DEVICE: string;
    LOG_FETCHER_FAILED: string;

    RECEIVE_TXN_REJECTED: (coin: string) => string;
    RECEIVE_TXN_DEVICE_MISCONFIGURED: string;
    RECEIVE_TXN_DIFFERENT_ADDRESS: string;
    RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER: string;

    SEND_TXN_REJECTED: (coin: string) => string;
    SEND_TXN_INSUFFICIENT_BALANCE: (coin: string) => string;
    SEND_TXN_SUFFICIENT_CONFIRMED_BALANCE: string;
    SEND_TXN_SIZE_TOO_LARGE: string;
  };
}
