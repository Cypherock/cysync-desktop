import { I18nStrings } from './type';

// NOMENCLATURE
// Cypherock X1 Device: The hardware device
// Cypherock X1 Card: The 4 cards
// Cypherock X1 Wallet: Cypherock X1 Device + Cypherock X1 Card

const en: I18nStrings = {
  ERRORS: {
    UNKNOWN_COMMUNICATION_ERROR: flow =>
      `Some unknown communication error while ${flow}`,

    NETWORK_ERROR:
      'Some internal error occurred while communicating with the server. Please try again.',
    NETWORK_UNREACHABLE:
      'Failed to communicate with the server. Please check your internet connection and try again.',

    DEVICE_NOT_CONNECTED:
      'Please connect the cypherock X1 device before proceeding with this process',
    DEVICE_DISCONNECTED_IN_FLOW:
      'Hardware Wallet disconnected. Please reconnect the Cypherock X1 device',
    DEVICE_TIMEOUT_ERROR:
      'Some internal error occurred\n This maybe due to inactivity on the Cypherock X1 device',
    DEVICE_NOT_READY:
      'Please bring the device to the main menu before starting any process.',
    DEVICE_NOT_READY_IN_INITIAL:
      'Error connecting the device, please reconnect the device and try again.',
    DEVICE_NOT_SUPPORTED:
      'The connected device is not supported, please make sure that CySync and X1 device are up to date.',
    // I dont understand how this message would be helpful.
    DEVICE_MISCONFIGURED:
      'Your device is misconfigured, Please restart cySync App. If the problem persists, please contact us.',
    DEVICE_INFO_UNKNOWN_ERROR: `Some interal error occured. Please disconnect and then reconnect the device.`,

    WALLET_NOT_FOUND_IN_DEVICE:
      'This wallet does not seem to be present on the X1 device',
    WALLET_NOT_FOUND_IN_CARD:
      'This wallet does not seem to be present on the X1 Cards',
    WALLET_PARTIAL_STATE:
      'This wallet is misconfigured. Please select the wallet from the main menu on the device to fix it.',
    ALL_WALLET_PARTIAL_STATE:
      'All wallets are misconfigured. Please go to the wallets on the main menu and configure them again.',
    NO_WALLET_ON_DEVICE:
      'No wallet found. Please create a new wallet on the X1 device first',
    WALLET_IS_LOCKED:
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
    ADD_WALLET_UNKNOWN_ERROR: `Some internal error occurred. Please disconnect and reconnect the device and retry adding a wallet`,

    ADD_COIN_FAILED_DUE_TO_SERVER_ERROR: coins =>
      `Failed to communicate with the blockchain while adding ${coins}. Please check your internet connection.`,
    ADD_COIN_FAILED_INTERNAL_ERROR: coins =>
      `Some internal error occurred while adding ${coins}.`,
    ADD_COIN_FAILED: coins => `Error while adding coins: ${coins}.`,
    ADD_COIN_REJECTED:
      'Request was rejected on the X1 Wallet\nPlease restart the process to add coins.',
    ADD_COIN_UNKNOWN_ERROR: `Some internal error occured. Please disconnect and then reconnect the device and try adding coins.`,

    CARD_AUTH_REJECTED: 'X1 Card auth was rejected from device.',
    CARD_AUTH_FAILED:
      'X1 Card authentication failed. Please contact Cypherock immediately',
    CARD_AUTH_DEVICE_PAIRING_FAILED: 'Device-Card pairing failed',
    UNKNOWN_CARD_ERROR: 'Unknown card error occured',
    CARD_AUTH_UNKNOWN_ERROR:
      'Some internal error occured. Please retry the process.',

    DEVICE_AUTH_REJECTED: 'Device auth was rejected from the device.',
    DEVICE_AUTH_FAILED:
      'The device seems be compromised. Please contact Cypherock support.',
    DEVICE_AUTH_UNKNOWN_ERROR: `Some internal error occured. Please disconnect and then reconnect the device and retry.`,

    DEVICE_UPGRADE_REJECTED: 'Device upgrade rejected from device',
    DEVICE_UPGRADE_FAILED: 'Error on Device Update',
    DEVICE_UPGRADE_FIRMWARE_DOWNLOAD_FAILED:
      'Error in downloading the firmware. Please check your internet connection and try again.',
    DEVICE_UPGRADE_CONNECTION_FAILED_IN_AUTH:
      'Error connecting to the device. Please reconnect the device and try again.',
    DEVICE_UPGRADE_UNKNOWN_ERROR: `Some internal error occured. Please disconnect and then reconnect the device and retry upgrading the device.`,

    LOG_FETCHER_REJECTED:
      'Request rejected from device. Try attaching the device logs again.',
    LOG_FETCHER_DISABLED_ON_DEVICE:
      'Logs are disabled on the device, please enable it from device settings and try again.',
    LOG_FETCHING_CANCEL_FAILED: 'Something went wrong while cancelling.',
    LOG_FETCHER_UNKNOWN_ERROR:
      'Some internal error occurred. Please attach the device logs again.',

    RECEIVE_TXN_REJECTED: coin =>
      `Request was rejected on the X1 Wallet\nPlease restart the process to receive ${coin} on the CySync application`,
    RECEIVE_TXN_DEVICE_MISCONFIGURED:
      'Looks like your device has been misconfigured, do you want to configure it now?',
    RECEIVE_TXN_DIFFERENT_ADDRESS_FROM_DEVICE:
      'Some error occurred while fetching the address.',
    RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER: `Please contact cypherock if the addresses on the application did not match the addresses on the device`,

    SEND_TXN_REJECTED: (coin: string) =>
      `Request was rejected on the X1 Wallet\nPlease restart the process to send ${coin} on the CySync application`,
    SEND_TXN_INSUFFICIENT_BALANCE: (coin: string) =>
      `You do not have enough ${coin} to make this transaction`,
    SEND_TXN_SUFFICIENT_CONFIRMED_BALANCE: `This transaction requires UTXOs from your previous transaction. Wait for few minutes before retrying`,
    SEND_TXN_SIZE_TOO_LARGE: 'This transaction cannot be performed.',
    SENX_TXN_BROADCAST_FAILED: 'Error trying to broadcast transaction.',
    SEND_TXN_UNKNOWN_ERROR: `Some internal occured. Please disconnect and then reconnect the device and retry.`,

    RECEIVE_TXN_XPUB_MISSING: 'Coin/Xpub is not present on device',
    RECEIVE_TXN_UNKNOWN_ERROR: `Some internal occured. Please disconnect and then reconnect the device and retry.`,

    INCOMPATIBLE_DEVICE: 'Device needs upgrade',
    INCOMPATIBLE_DESKTOP: 'Application needs upgrade',
    INCOMPATIBLE_DEVICE_AND_DESKTOP: 'Both needs upgrade',

    TUTORIALS_UNKNOWN_ERROR:
      'Some internal error occured while fetching tutorials.'
  }
};

export default en;
