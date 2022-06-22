import { I18nStrings } from './type';

// NOMENCLATURE
// Cypherock X1 Device: The hardware device
// Cypherock X1 Card: The 4 cards
// Cypherock X1 Wallet: Cypherock X1 Device + Cypherock X1 Card

const en: I18nStrings = {
  ERRORS: {
    UNKNOWN_FLOW_ERROR:
      'Some internal error occurred. Please disconnect and then reconnect the device and restart the process',

    NETWORK_ERROR:
      'Some internal error occurred while communicating with the server. Please try again later.',
    NETWORK_ERROR_WITH_NO_RESPONSE:
      'Failed to communicate with the server. Please check your internet connection and try again later.',

    DEVICE_NOT_CONNECTED:
      'Error Code: HD_INIT_1001 | Please connect the cypherock X1 wallet before proceeding with this process',
    DEVICE_DISCONNECTED_IN_FLOW:
      'Error Code: HD_INIT_1002 | Device disconnected. Please reconnect the Cypherock X1 device and try again',
    DEVICE_READ_TIMEOUT:
      'Error Code: HD_COM_1004 | Read timeout: Did not receive expected command on time from device',
    DEVICE_WRITE_TIMEOUT:
      'Error Code: HD_COM_1005 | Write timeout: Did not receive ACK on time',
    DEVICE_NOT_READY:
      'Error Code: HD_INIT_1003 | Please bring the device to the main menu before starting any process from the CySync App.',
    DEVICE_NOT_READY_IN_INITIAL:
      'Error Code: HD_INIT_1004 | Error connecting the device, please reconnect the device.',
    DEVICE_NOT_SUPPORTED:
      'The connected device is not supported, please make sure that CySync and X1 wallet are up to date.',

    WALLET_NOT_FOUND:
      'This wallet does not seem to be present on the X1 wallet',
    WALLET_NOT_ON_CARD:
      'This wallet does not seem to be present on the X1 Cards',
    WALLET_PARTIAL_STATE:
      'This wallet is misconfigured. Please select the wallet from the main menu on the device to fix it.',
    ALL_WALLET_PARTIAL_STATE:
      'All wallets are misconfigured. Please go to the wallets from the main menu and configure them again.',
    NO_WALLET_ON_DEVICE:
      'No wallet found. Please add a new wallet on the X1 wallet first',
    WALLET_LOCKED:
      'Wallet is locked on the device\nPlease unlock it before continuing with any operations on the wallet',
    WALLET_LOCKED_DUE_TO_INCORRECT_PIN:
      'Your wallet is now locked due to multiple incorrect attempts\nPlease unlock it before continuing with any operations on the wallet',

    ADD_WALLET_REJECTED:
      'Request rejected on X1 wallet. Please restart the process to add a new wallet',
    ADD_WALLET_LIMIT_EXCEEDED: 'Cannot add more than 4 wallets.',
    ADD_WALLET_DUPLICATE:
      'This wallet already exists on the CySync Application.',
    ADD_WALLET_DUPLICATE_WITH_DIFFERENT_NAME:
      'This wallet already exists on the CySync Application with a different name. Do you want to update the name?',
    ADD_WALLET_WITH_SAME_NAME:
      'A wallet with the same name already exists on the CySync Application',

    ADD_COIN_FAILED_DUE_TO_SERVER_ERROR: coins =>
      `Failed to communicate with the blockchain while adding ${coins}. Please check your internet connection.`,
    ADD_COIN_FAILED_INTERNAL_ERROR: coins =>
      `Some internal error occurred while adding ${coins}.`,
    ADD_COIN_FAILED: coins => `Error on adding coins: ${coins}.`,
    ADD_COIN_REJECTED:
      'Request was rejected on the X1 Wallet\nPlease restart the process to add new coins on the CySync application',

    CARD_AUTH_REJECTED: 'X1 Card auth was rejected from device.',
    CARD_AUTH_FAILED:
      'X1 Card authentication failed. Please contact Cypherock immediately',
    CARD_AUTH_DEVICE_PAIRING_FAILED: 'Device-Card pairing failed',

    DEVICE_AUTH_REJECTED: 'Device auth was rejected from the device.',
    DEVICE_AUTH_FAILED:
      'The device seems be compromised. Please contact Cypherock support.',

    DEVICE_UPGRADE_REJECTED: 'Device upgrade rejected from device',
    DEVICE_UPGRADE_FAILED: 'Error on Device Update',
    DEVICE_UPGRADE_FIRMWARE_DOWNLOAD_FAILED:
      'Error in downloading the firmware. Please check your internet connection and try again.',
    DEVICE_UPGRADE_CONNECTION_FAILED_IN_AUTH:
      'Error connecting to the device. Please reconnect the device and try again.',

    LOG_FETCHER_REJECTED:
      'Request rejected from device. Try attaching the device logs again.',
    LOG_FETCHER_DISABLED_ON_DEVICE:
      'Logs are disabled on the device, please enable it from device settings and try again.',
    LOG_FETCHER_FAILED:
      'Some internal error occurred. Please attach the device logs again.',

    RECEIVE_TXN_REJECTED: coin =>
      `Request was rejected on the X1 Wallet\nPlease restart the process to receive ${coin} on the CySync application`,
    RECEIVE_TXN_DEVICE_MISCONFIGURED:
      'Looks like your device has been misconfigured, do you want to configure it now?',
    RECEIVE_TXN_DIFFERENT_ADDRESS:
      'Some error occurred while fetching the address.',
    RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER: `Please contact cypherock if the addresses on the application did not match the addresses on the device`,

    SEND_TXN_REJECTED: (coin: string) =>
      `Request was rejected on the X1 Wallet\nPlease restart the process to send ${coin} on the CySync application`,
    SEND_TXN_INSUFFICIENT_BALANCE: (coin: string) =>
      `You do not have enough ${coin} to make this transaction`,
    SEND_TXN_SUFFICIENT_CONFIRMED_BALANCE: `This transaction requires UTXOs from your previous transaction. Wait for few minutes before retrying`,
    SEND_TXN_SIZE_TOO_LARGE: 'This transaction cannot be performed.'
  }
};

export default en;
