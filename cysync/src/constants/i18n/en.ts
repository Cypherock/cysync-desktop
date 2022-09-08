import { I18nStrings } from './type';

// NOMENCLATURE
// Cypherock X1 Device: The hardware device
// Cypherock X1 Card: The 4 cards
// Cypherock X1 Wallet: Cypherock X1 Device + Cypherock X1 Card

const en: I18nStrings = {
  ERRORS: {
    UNKNOWN_COMMUNICATION_ERROR: flow =>
      `Some unknown communication error while ${flow}`,

    NETWORK_FAILURE:
      'Some internal error occurred while communicating with the server. Try again.',
    NETWORK_UNREACHABLE:
      'Failed to communicate with the server. Check your internet connection and try again.',

    DEVICE_NOT_CONNECTED:
      'Connect the cypherock X1 wallet before proceeding with this operation',
    DEVICE_DISCONNECTED_IN_FLOW: 'X1 wallet disconnected, reconnect',
    DEVICE_TIMEOUT_ERROR:
      'Some internal error occurred\n This maybe due to inactivity on the X1 wallet',
    DEVICE_NOT_READY:
      'Bring the X1 wallet to the main menu before starting any operation.',
    DEVICE_NOT_READY_IN_INITIAL:
      'Error connecting the X1 wallet, reconnect the X1 wallet and try again.',
    DEVICE_NOT_SUPPORTED:
      'The connected X1 wallet is not supported, make sure that CySync and X1 wallet are up to date.',
    // I dont understand how this message would be helpful.
    DEVICE_MISCONFIGURED:
      'Your X1 wallet is misconfigured. Upgrade your X1 wallet. If the problem persists, contact us.',
    DEVICE_INFO_UNKNOWN_ERROR: `Some interal error occured. Disconnect and then reconnect the X1 wallet.`,
    DEVICE_NOT_IN_UPDATE_RECEIVING_MODE: `Some interal error occured. Disconnect and then reconnect the X1 wallet.`,

    WALLET_NOT_FOUND_IN_DEVICE:
      'This wallet account does not seem to be present on the X1 wallet',
    WALLET_NOT_FOUND_IN_CARD:
      'This wallet account does not seem to be present on the X1 cards',
    WALLET_PARTIAL_STATE:
      'This wallet account is misconfigured. Select the wallet account from the main menu on the X1 wallet to fix it.',
    NO_VALID_WALLET_FOUND:
      'All wallet accounts are misconfigured. Go to the wallet accounts on the main menu and configure them again.',
    NO_WALLET_ON_DEVICE:
      'No wallet accounts found. Create a new wallet account on the X1 wallet first',
    WALLET_IS_LOCKED:
      'Wallet account is locked on the X1 wallet\nUnlock it before continuing with any operations on the wallet account',
    WALLET_LOCKED_DUE_TO_INCORRECT_PIN:
      'Your wallet account is now locked due to multiple incorrect attempts\nUnlock it before continuing with any operations on the wallet account',
    WALLET_UNKNOWN_STATE:
      'Unknown wallet account state received from X1 wallet',

    ADD_WALLET_REJECTED:
      'Request rejected on X1 wallet. Restart the operation to add a new wallet account',
    ADD_WALLET_LIMIT_EXCEEDED: 'Cannot add more than 4 wallet accounts.',
    ADD_WALLET_DUPLICATE:
      'This wallet account already exists on the CySync Application.',
    ADD_WALLET_DUPLICATE_WITH_DIFFERENT_DETAILS:
      'This wallet account already exists on the CySync Application with different configuration. Do you want to update the wallet account details?',
    ADD_WALLET_WITH_SAME_NAME:
      'A wallet account with the same name already exists on the CySync Application',
    ADD_WALLET_UNKNOWN_ERROR: `Some internal error occurred. Disconnect and reconnect the X1 wallet and retry adding a wallet account`,

    ADD_COIN_FAILED_DUE_TO_SERVER_ERROR: coins =>
      `Failed to communicate with the blockchain while adding ${coins}. Check your internet connection.`,
    ADD_COIN_FAILED_INTERNAL_ERROR: coins =>
      `Some internal error occurred while adding ${coins}.`,
    ADD_COIN_FAILED: coins => `Error while adding coins: ${coins}.`,
    ADD_COIN_REJECTED:
      'Request was rejected on the X1 wallet\nRestart the operation to add coins.',
    ADD_COIN_UNKNOWN_ERROR: `Some internal error occured. Disconnect and then reconnect the X1 wallet and try adding coins.`,

    CARD_AUTH_REJECTED: 'X1 Card auth was rejected from X1 wallet.',
    CARD_AUTH_FAILED:
      'X1 Card authentication failed. Contact Cypherock immediately',
    CARD_AUTH_DEVICE_PAIRING_FAILED: 'Device-Card pairing failed',
    UNKNOWN_CARD_ERROR: 'Unknown X1 card error occured',
    CARD_AUTH_UNKNOWN_ERROR:
      'Some internal error occured. Retry the operation.',

    DEVICE_AUTH_REJECTED: 'Device auth was rejected from the X1 wallet.',
    DEVICE_AUTH_FAILED:
      'The X1 wallet seems be compromised. Contact Cypherock support.',
    DEVICE_AUTH_UNKNOWN_ERROR: `Some internal error occured. Disconnect and then reconnect the X1 wallet and retry.`,

    DEVICE_UPGRADE_REJECTED: 'Device upgrade rejected from X1 wallet',
    DEVICE_UPGRADE_FAILED: 'Error on Device Update',
    DEVICE_UPGRADE_FIRMWARE_DOWNLOAD_FAILED:
      'Error in downloading the firmware. Check your internet connection and try again.',
    DEVICE_UPGRADE_CONNECTION_FAILED_IN_AUTH:
      'Error connecting to the X1 wallet. Reconnect the X1 wallet and try again.',
    DEVICE_UPGRADE_KNOWN_ERROR:
      'An internal error occured. Report it to Cypherock immediately.',
    DEVICE_UPGRADE_UNKNOWN_ERROR: `Some internal error occured. Disconnect and then reconnect the X1 wallet and retry upgrading the X1 wallet.`,

    LOG_FETCHER_REJECTED:
      'Request rejected from X1 wallet. Try attaching the X1 wallet logs again.',
    LOG_FETCHER_DISABLED_ON_DEVICE:
      'Logs are disabled on the X1 wallet, Enable it from X1 wallet settings and try again.',
    LOG_FETCHING_CANCEL_FAILED: 'Something went wrong while cancelling.',
    LOG_FETCHER_UNKNOWN_ERROR:
      'Some internal error occurred. Attach the X1 wallet logs again.',

    RECEIVE_TXN_REJECTED: coin =>
      `Request was rejected on the X1 wallet\nRestart the operation to receive ${coin} on the CySync application`,
    RECEIVE_TXN_DEVICE_MISCONFIGURED:
      'Looks like your X1 wallet has been misconfigured, do you want to configure it now?',
    RECEIVE_TXN_GENERATE_UNVERIFIED_FAILED:
      'Error in Generating Unverified receiveAddress',
    RECEIVE_TXN_DIFFERENT_ADDRESS_FROM_DEVICE:
      'Some error occurred while fetching the address.',
    RECEIVE_TXN_DIFFERENT_ADDRESS_BY_USER: `Contact cypherock if the addresses on the application did not match the addresses on the X1 wallet`,

    SEND_TXN_REJECTED: (coin: string) =>
      `Request was rejected on the X1 wallet\nRestart the operation to send ${coin} on the CySync application`,
    SEND_TXN_INSUFFICIENT_BALANCE: (coin: string) =>
      `You do not have enough ${coin} to make this transaction`,
    SEND_TXN_BLOCKED_UTXOS_WITH_SUFFICIENT_BALANCE: `This transaction requires UTXOs from your previous transaction. Wait for few minutes before retrying`,
    SEND_TXN_SIZE_TOO_LARGE: 'This transaction cannot be performed.',
    SEND_TXN_BROADCAST_FAILED: 'Error trying to broadcast transaction.',
    SEND_TXN_UNKNOWN_ERROR: `Some internal occured. Disconnect and then reconnect the X1 wallet and retry.`,

    RECEIVE_TXN_XPUB_MISSING: 'Coin/Xpub is not present on X1 wallet',
    RECEIVE_TXN_UNKNOWN_ERROR: `Some internal occured. Disconnect and then reconnect the X1 wallet and retry.`,

    INCOMPATIBLE_DEVICE: 'Device needs upgrade',
    INCOMPATIBLE_DESKTOP: 'Application needs upgrade',
    INCOMPATIBLE_DEVICE_AND_DESKTOP: 'Both needs upgrade',

    TUTORIALS_UNKNOWN_ERROR:
      'Some internal error occured while fetching tutorials.',
    STOP_ONGOING_FLOW: 'Stopping an ongoing flow',
    PROCESS_ABORTED_BY_USER: (flow: string) => `${flow} was stopped by user`,

    RETRY_DISABLED_DUE_TO_NO_DEVICE_CONNECTION: 'Reconnect the X1 wallet',
    RETRY_DISABLED_DUE_TO_NO_INTERNET:
      'Check your internet connection and try again'
  }
};

export default en;
