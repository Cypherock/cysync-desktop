import {
  COINS,
  DeviceConnection,
  DeviceError,
  DeviceErrorType,
  FeatureName,
  isFeatureEnabled
} from '@cypherock/communication';
import { SignMessage, WalletStates } from '@cypherock/protocols';
import { WalletError } from '@cypherock/wallet';
import { useEffect, useState } from 'react';

import {
  CyError,
  CysyncError,
  handleAxiosErrors,
  handleDeviceErrors,
  handleErrors,
  handleWalletErrors
} from '../../../errors';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';

import * as flowHandlers from './handlers';

const flowName = Analytics.Categories.SIGN_MESSAGE;

export interface HandleSignMessageOptions {
  connection: DeviceConnection;
  sdkVersion: string;
  setIsInFlow: (val: boolean) => void;
  walletId: string;
  pinExists: boolean;
  passphraseExists: boolean;
  accountId: string;
  accountIndex: number;
  accountType: string;
  coinId: string;
  xpub: string;
  message: string;
  requestType: number;
}

export interface UseSignMessageValues {
  handleSignMessage: (options: HandleSignMessageOptions) => Promise<void>;
  deviceConnected: boolean;
  setDeviceConnected: React.Dispatch<React.SetStateAction<boolean>>;
  completed: boolean;
  setCompleted: React.Dispatch<React.SetStateAction<boolean>>;
  errorObj: CyError;
  clearErrorObj: () => void;
  coinsConfirmed: boolean;
  metadataSent: boolean;
  verified: boolean;
  pinEntered: boolean;
  passphraseEntered: boolean;
  cardsTapped: boolean;
  signature: string;
  resetHooks: () => void;
  cancelSignMessage: (connection: DeviceConnection) => void;
}

export type UseSignMessage = () => UseSignMessageValues;

export const useSignMessage: UseSignMessage = () => {
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [coinsConfirmed, setCoinsConfirmed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [verified, setVerified] = useState(false);
  const [pinEntered, setPinEntered] = useState(false);
  const [passphraseEntered, setPassphraseEntered] = useState(false);
  const [cardsTapped, setCardsTapped] = useState(false);
  const [signature, setSignature] = useState('');
  const [metadataSent, setMetadataSent] = useState(false);
  const signMessage = new SignMessage();
  const [isCancelled, setIsCancelled] = useState(false);

  const [errorObj, setErrorObj] = useState<CyError>(new CyError());

  const resetHooks = () => {
    setDeviceConnected(false);
    setCoinsConfirmed(false);
    setVerified(false);
    setPinEntered(false);
    setPassphraseEntered(false);
    setCardsTapped(false);
    setSignature('');
    setCompleted(false);
    setMetadataSent(false);
    signMessage.removeAllListeners();
  };

  const clearAll = () => {
    setIsCancelled(false);
    clearErrorObj();
    resetHooks();
  };

  const handleSignMessage: UseSignMessageValues['handleSignMessage'] = async ({
    connection,
    sdkVersion,
    setIsInFlow,
    walletId,
    pinExists,
    passphraseExists,
    xpub,
    accountId,
    accountType,
    accountIndex,
    coinId,
    message,
    requestType
  }) => {
    clearAll();

    logger.info('SignMessage: Initiated', { coinId });
    logger.info('SignMessage Data', {
      walletId,
      pinExists,
      coinId,
      message
    });
    logger.debug('SignMessage Xpub', {
      xpub
    });

    if (!connection) {
      const cyError = new CyError(DeviceErrorType.NOT_CONNECTED);
      setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
      return;
    }

    if (!isFeatureEnabled(FeatureName.WalletConnectSupport, sdkVersion)) {
      const cyError = new CyError(DeviceErrorType.FEATURE_NOT_SUPPORTED);
      setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
      return;
    }

    signMessage.on('connectionOpen', () => {
      logger.info('SignMessage: Connection Opened');
    });

    signMessage.on('connectionClose', () => {
      logger.info('SignMessage: Connection Closed');
    });

    signMessage.on('cardError', () => {
      const cyError = new CyError(CysyncError.UNKNOWN_CARD_ERROR);
      setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
    });

    signMessage.on('error', err => {
      const cyError = new CyError();
      if (err instanceof WalletError) {
        handleWalletErrors(cyError, err, { coinId });
      } else if (err.isAxiosError) {
        handleAxiosErrors(cyError, err);
      } else if (err instanceof DeviceError) {
        handleDeviceErrors(cyError, err, flowName);
      } else {
        cyError.setError(CysyncError.SEND_TXN_UNKNOWN_ERROR);
      }
      setErrorObj(handleErrors(errorObj, cyError, flowName, { err }));
    });

    signMessage.on('locked', () => {
      const cyError = new CyError(CysyncError.WALLET_IS_LOCKED);
      setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
    });

    signMessage.on('notReady', () => {
      const cyError = new CyError(CysyncError.DEVICE_NOT_READY);
      setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
    });

    signMessage.on('coinsConfirmed', coins => {
      if (coins) {
        logger.verbose('SignMessage: Txn confirmed', { coinId });
        setCoinsConfirmed(true);
      } else {
        const cyError = new CyError(
          CysyncError.SEND_TXN_REJECTED,
          COINS[coinId].name
        );
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
      }
    });

    signMessage.on('txnTooLarge', () => {
      const cyError = new CyError(CysyncError.SEND_TXN_SIZE_TOO_LARGE);
      setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
    });

    signMessage.on('noWalletFound', (walletState: WalletStates) => {
      const cyError = flowHandlers.noWalletFound(walletState);
      setErrorObj(
        handleErrors(errorObj, cyError, flowName, {
          coinId,
          walletState
        })
      );
    });

    signMessage.on('noWalletOnCard', () => {
      const cyError = new CyError(CysyncError.WALLET_NOT_FOUND_IN_CARD);
      setErrorObj(handleErrors(errorObj, cyError, flowName));
    });

    // Verified receives `true` if verified, otherwise the index of the rejection screen
    signMessage.on('verified', val => {
      if (val === true) {
        logger.verbose('SignMessage: Message verified', { coinId });
        setVerified(true);
      } else {
        const cyError = new CyError(CysyncError.SEND_TXN_REJECTED);

        logger.info('SignMessage: Message rejected from device', {
          coinId,
          command: val
        });

        if (val === 0) {
          cyError.pushSubErrors(CysyncError.SEND_TXN_REJECTED_AT_ADDRESS);
        } else if (val === 2) {
          cyError.pushSubErrors(CysyncError.SEND_TXN_REJECTED_AT_AMOUNT);
        } else if (val === 3) {
          cyError.pushSubErrors(CysyncError.SEND_TXN_REJECTED_AT_FEE);
        } else {
          cyError.pushSubErrors(CysyncError.SEND_TXN_REJECTED_AT_UNKNOWN);
        }
        setErrorObj(handleErrors(errorObj, cyError, flowName));
      }
    });

    signMessage.on('passphraseEntered', () => {
      logger.verbose('SignMessage: Passphrase entered', { coinId });
      setPassphraseEntered(true);
    });

    signMessage.on('pinEntered', pin => {
      if (pin) {
        logger.verbose('SignMessage: Pin entered', { coinId });
        setPinEntered(true);
      } else {
        const cyError = new CyError(
          CysyncError.WALLET_LOCKED_DUE_TO_INCORRECT_PIN
        );
        setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
      }
    });

    signMessage.on('cardsTapped', cards => {
      if (cards) {
        logger.verbose('SignMessage: Cards tapped', { coinId });
        setCardsTapped(true);
      }
    });

    signMessage.on('metadataSent', () => {
      logger.verbose('SignMessage: Metadata sent', { coinId });
      setMetadataSent(true);
    });

    signMessage.on('signature', txn => {
      if (txn) {
        logger.verbose('SignMessage: Signature received', { coinId });
        setSignature(txn);
      } else {
        const cyError = new CyError(CysyncError.SEND_TXN_UNKNOWN_ERROR);
        cyError.pushSubErrors(CysyncError.SEND_TXN_SIGNED_TXN_NOT_FOUND);
        setErrorObj(handleErrors(errorObj, cyError, flowName, { txn, coinId }));
      }
    });

    try {
      setIsInFlow(true);
      /**
       * Error will be thrown in rare conditions where the implementation
       * itself has broken.
       */
      await signMessage.run({
        connection,
        sdkVersion,
        walletId,
        pinExists,
        passphraseExists,
        xpub,
        coinId,
        accountId,
        accountIndex,
        accountType,
        message,
        requestType
      });
      setIsInFlow(false);
      logger.info('SignMessage: Completed', { coinId });
      setCompleted(true);
    } catch (e) {
      setIsInFlow(false);
      const cyError = new CyError(CysyncError.SEND_TXN_UNKNOWN_ERROR);
      setErrorObj(handleErrors(errorObj, cyError, flowName, { coinId }));
      signMessage.removeAllListeners();
    }
  };

  const cancelSignMessage = async (connection: DeviceConnection) => {
    setIsCancelled(true);
    return signMessage
      .cancel(connection)
      .then(cancelled => {
        if (cancelled) {
          logger.info('SignMessage: Cancelled');
        }
      })
      .catch(e => {
        logger.error(
          `${CysyncError.SEND_TXN_CANCEL_FAILED} SignMessage: Error in flow cancel`
        );
        logger.error(e);
      });
  };

  // I think this will work, reset the error obj if its cancelled
  useEffect(() => {
    if (isCancelled && errorObj.isSet) {
      clearErrorObj();
    }
  }, [errorObj]);

  const clearErrorObj = () => {
    setErrorObj(new CyError());
  };

  return {
    handleSignMessage,
    deviceConnected,
    setDeviceConnected,
    errorObj,
    clearErrorObj,
    completed,
    setCompleted,
    coinsConfirmed,
    verified,
    pinEntered,
    passphraseEntered,
    cardsTapped,
    signature,
    metadataSent,
    resetHooks,
    cancelSignMessage
  };
};
