import {
  DeviceConnection,
  DeviceError,
  DeviceErrorType
} from '@cypherock/communication';
import { CardAuthenticator } from '@cypherock/protocols';
import { useState } from 'react';

import { useI18n } from '../../../store/provider';
import logger from '../../../utils/logger';

export interface HandleCardAuthOptions {
  connection: DeviceConnection;
  sdkVersion: string;
  setIsInFlow: (val: boolean) => void;
  firmwareVersion: string;
  cardNumber?: string;
  isTestApp?: boolean;
}

export interface UseCardAuthValues {
  handleCardAuth: (options: HandleCardAuthOptions) => Promise<void>;
  requestStatus: 0 | 1 | -1 | 2;
  processStatus: number;
  verified: 0 | 1 | -1 | 2;
  pairingFailed: boolean;
  isCardError: boolean;
  isNetworkError: boolean;
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  completed: boolean;
  resetHooks: () => void;
  cancelCardAuth: (connection: DeviceConnection) => void;
}

export type UseCardAuth = (isInitial?: boolean) => UseCardAuthValues;

export const useCardAuth: UseCardAuth = isInitial => {
  const [errorMessage, setErrorMessage] = useState('');
  const [verified, setVerified] = useState<-1 | 0 | 1 | 2>(0);
  const [pairingFailed, setPairingFailed] = useState(false);
  const [isCardError, setCardError] = useState(false);
  const [isNetworkError, setNetworkError] = useState(false);
  const [requestStatus, setRequestStatus] = useState<-1 | 0 | 1 | 2>(0);
  const [processStatus, setProcessStatus] = useState<-1 | 0 | 1 | 2>(0);
  const [completed, setCompleted] = useState(false);
  const cardAuth = new CardAuthenticator();
  const { langStrings } = useI18n();

  // To call resetHooks outside of this function
  const resetHooks = () => {
    setVerified(0);
    setPairingFailed(false);
    setRequestStatus(0);
    setProcessStatus(0);
    setCompleted(false);
    cardAuth.removeAllListeners();
  };

  const clearAll = () => {
    setCardError(false);
    setNetworkError(false);
    setErrorMessage('');
    resetHooks();
  };

  const handleCardAuth = async ({
    connection,
    sdkVersion,
    setIsInFlow,
    firmwareVersion,
    cardNumber = '01',
    isTestApp = false
  }: HandleCardAuthOptions) => {
    clearAll();

    logger.info('CardAuth: Initiated', { cardNumber });
    setRequestStatus(1);

    cardAuth.on('connectionOpen', () => {
      logger.info('CardAuth: Connection Opened');
    });

    cardAuth.on('connectionClose', () => {
      logger.info('CardAuth: Connection Closed');
    });

    cardAuth.on('cardError', () => {
      setCardError(true);
      logger.info('CardAuth: Card Error');
      setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
    });

    cardAuth.on('error', err => {
      logger.error('CardAuth: Error occurred in card auth flow');
      logger.error(err);
      if (err.isAxiosError) {
        setNetworkError(true);
        if (err.response) {
          setErrorMessage(langStrings.ERRORS.NETWORK_ERROR);
        } else {
          setErrorMessage(langStrings.ERRORS.NETWORK_ERROR_WITH_NO_RESPONSE);
        }
      } else if (err instanceof DeviceError) {
        if (
          [
            DeviceErrorType.CONNECTION_CLOSED,
            DeviceErrorType.CONNECTION_NOT_OPEN
          ].includes(err.errorType)
        ) {
          setErrorMessage(langStrings.ERRORS.DEVICE_DISCONNECTED_IN_FLOW);
        } else if (err.errorType === DeviceErrorType.NOT_CONNECTED) {
          setErrorMessage(langStrings.ERRORS.DEVICE_NOT_CONNECTED);
        } else if (
          [
            DeviceErrorType.WRITE_TIMEOUT,
            DeviceErrorType.READ_TIMEOUT
          ].includes(err.errorType)
        ) {
          setErrorMessage(langStrings.ERRORS.DEVICE_TIMEOUT_ERROR);
        } else {
          setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
        }
      } else {
        setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
      }
    });

    cardAuth.on('acceptedRequest', acceptedRequest => {
      if (acceptedRequest) {
        setRequestStatus(2);
        setVerified(1);
      } else {
        logger.info('CardAuth: Rejected from device');
        setErrorMessage(langStrings.ERRORS.CARD_AUTH_REJECTED);
        setRequestStatus(-1);
      }
    });

    cardAuth.on('serialSigned', () => {
      setProcessStatus(1);
    });

    cardAuth.on('challengeSigned', () => {
      setProcessStatus(2);
    });

    cardAuth.on('verified', (v: boolean) => {
      if (v) {
        logger.info('CardAuth: Card verified');
        setVerified(2);
      } else {
        logger.info('CardAuth: Card verification failed');
        setVerified(-1);
        setProcessStatus(-1);
        setErrorMessage(langStrings.ERRORS.CARD_AUTH_FAILED);
      }
    });

    cardAuth.on('pairingFailed', () => {
      logger.info('CardAuth: Pairing failed');
      setPairingFailed(true);
      setProcessStatus(-1);
      setErrorMessage(langStrings.ERRORS.CARD_AUTH_DEVICE_PAIRING_FAILED);
    });

    cardAuth.on('notReady', () => {
      logger.info('CardAuth: Device not ready');
      if (isInitial) {
        setErrorMessage(langStrings.ERRORS.DEVICE_NOT_READY_IN_INITIAL);
      } else {
        setErrorMessage(langStrings.ERRORS.DEVICE_NOT_READY);
      }
    });

    try {
      setIsInFlow(true);
      /**
       * Error will be thrown in rare conditions where the implementation
       * itself has broken.
       */
      await cardAuth.run({
        connection,
        sdkVersion,
        firmwareVersion,
        cardNumber,
        isTestApp
      });
      setIsInFlow(false);
      logger.info('CardAuth: completed.');
      setCompleted(true);
    } catch (e) {
      setIsInFlow(false);
      logger.error('CardAuth: Some error occurred.');
      logger.error(e);
      setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
      setCompleted(true);
      cardAuth.removeAllListeners();
    }
  };

  const cancelCardAuth = async (connection: DeviceConnection) => {
    return cardAuth
      .cancel(connection)
      .then(canclled => {
        if (canclled) {
          logger.info('CardAuth: Cancelled');
        }
      })
      .catch(e => {
        logger.error('CardAuth: Error in flow cancel');
        logger.error(e);
      });
  };

  return {
    handleCardAuth,
    requestStatus,
    processStatus,
    verified,
    isCardError,
    isNetworkError,
    errorMessage,
    setErrorMessage,
    completed,
    resetHooks,
    cancelCardAuth,
    pairingFailed
  } as UseCardAuthValues;
};
