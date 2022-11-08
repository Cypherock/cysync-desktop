import { DeviceConnection, DeviceError } from '@cypherock/communication';
import { CardAuthenticator } from '@cypherock/protocols';
import { useEffect, useRef, useState } from 'react';

import {
  CyError,
  CysyncError,
  handleAxiosErrors,
  handleDeviceErrors,
  handleErrors
} from '../../../errors';
import {
  DeviceConnectionState,
  FeedbackState,
  useConnection,
  useFeedback,
  useI18n,
  useNetwork
} from '../../../store/provider';
import Analytics from '../../../utils/analytics';
import { hexToVersion, inTestApp } from '../../../utils/compareVersion';
import logger from '../../../utils/logger';
import sleep from '../../../utils/sleep';

export interface HandleCardAuthOptions {
  connection: DeviceConnection;
  sdkVersion: string;
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
  errorObj: CyError;
  clearErrorObj: () => void;
  cardsStatus: 0 | 1 | -1 | 2;
  connStatus: 0 | 1 | -1 | 2;
  cardsAuth: ICardAuthState;
  showRetry: boolean;
  enableRetry: boolean;
  enableRetryErrorMsg: string;
  onRetry: () => void;
  setCardsStatus: React.Dispatch<React.SetStateAction<0 | 1 | -1 | 2>>;
  completed: boolean;
  resetHooks: () => void;
  cancelCardAuth: (connection: DeviceConnection) => void;
  handleFeedbackOpen: () => void;
}

export interface ICardAuthState {
  '01': -1 | 0 | 1 | 2;
  '02': -1 | 0 | 1 | 2;
  '03': -1 | 0 | 1 | 2;
  '04': -1 | 0 | 1 | 2;
}

export type UseCardAuth = (isInitial?: boolean) => UseCardAuthValues;

const flowName = Analytics.Categories.CARD_AUTH;
export const useCardAuth: UseCardAuth = isInitial => {
  const lang = useI18n();

  const [errorObj, setErrorObj] = useState<CyError>(new CyError());
  const [verified, setVerified] = useState<-1 | 0 | 1 | 2>(0);
  const [pairingFailed, setPairingFailed] = useState(false);
  const [isCardError, setCardError] = useState(false);
  const [isNetworkError, setNetworkError] = useState(false);
  const [requestStatus, setRequestStatus] = useState<-1 | 0 | 1 | 2>(0);
  const [processStatus, setProcessStatus] = useState<-1 | 0 | 1 | 2>(0);
  const [completed, setCompleted] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [enableRetry, setEnableRetry] = useState(true);
  const [enableRetryErrorMsg, setEnableRetryErrorMsg] = useState('');
  /**
   * -2 means authentication is remaining
   * -1 means all cards failed authentication
   * 0 means some cards failed authentication
   * 1 means all cards are successfully authenticated
   */
  const [cardsStatus, setCardsStatus] = useState<-2 | -1 | 0 | 1>(-2);

  const [connStatus, setConnStatus] = useState<-1 | 0 | 1 | 2>(1);
  const [initialStart, setInitialStart] = useState(false);
  const [cardsAuth, setCardsAuth] = useState<ICardAuthState>({
    '01': 0,
    '02': 0,
    '03': 0,
    '04': 0
  });

  const [currentCard, setCurrentCard] = useState<
    '00' | '01' | '02' | '03' | '04'
  >('00');

  const incrementCurrentCard = (current: string) => {
    if (current === '01') return '02';
    if (current === '02') return '03';
    if (current === '03') return '04';
    return '00';
  };
  const cardAuth = new CardAuthenticator();

  const {
    internalDeviceConnection: deviceConnection,
    deviceSdkVersion,
    connected,
    inBootloader,
    firmwareVersion,
    inBackgroundProcess,
    deviceConnectionState,
    setIsInFlow,
    deviceState
  } = useConnection();
  const { connected: internetConnected } = useNetwork();

  useEffect(() => {
    let allowRetry = true;
    if (!deviceConnection) {
      allowRetry = false;
      setEnableRetryErrorMsg(
        lang.langStrings.ERRORS.RETRY_DISABLED_DUE_TO_NO_DEVICE_CONNECTION
      );
    } else if (!internetConnected) {
      allowRetry = false;
      setEnableRetryErrorMsg(
        lang.langStrings.ERRORS.RETRY_DISABLED_DUE_TO_NO_INTERNET
      );
    } else {
      allowRetry = true;
      setEnableRetryErrorMsg('');
    }

    setEnableRetry(allowRetry);
  }, [deviceConnection, internetConnected]);

  useEffect(() => {
    if (errorObj.isSet && internetConnected) setShowRetry(true);
  }, [internetConnected, errorObj]);

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
    clearErrorObj();
    resetHooks();
  };

  useEffect(() => {
    if (
      deviceConnection &&
      !inBackgroundProcess &&
      [
        DeviceConnectionState.IN_TEST_APP,
        DeviceConnectionState.IN_BOOTLOADER
      ].includes(deviceConnectionState)
    ) {
      const cyError = new CyError();
      if (inBootloader) {
        setShowRetry(false);
        cyError.setError(CysyncError.DEVICE_IN_BOOTLOADER);
        setErrorObj(
          handleErrors(errorObj, cyError, flowName, {
            deviceConnectionState,
            deviceConnection,
            inBootloader,
            inBackgroundProcess
          })
        );

        return;
      }

      setConnStatus(2);

      if (initialStart) {
        return;
      }

      clearErrorObj();
      if (currentCard === '00') {
        setCardsAuth({ ...cardsAuth, '01': 1 });
        setCurrentCard('01');
      } else {
        const temp = { ...cardsAuth };
        temp[currentCard] = 1;
        setCardsAuth(temp);
        // 0.1 second delay to give time to the device for processing
        sleep(100)
          .then(() => {
            if (firmwareVersion) {
              return handleCardAuth({
                connection: deviceConnection,
                sdkVersion: deviceSdkVersion,
                cardNumber: currentCard,
                isTestApp: inTestApp(deviceState)
              });
            }
          })
          .catch(() => {
            // empty
          });
      }
      setInitialStart(true);
    } else if (!deviceConnection) {
      setConnStatus(-1);
    } else {
      setConnStatus(1);
    }
  }, [deviceConnection, connected, inBackgroundProcess]);

  useEffect(() => {
    const temp = { ...cardsAuth };
    if (currentCard === '00') {
      return;
    }

    if (completed) {
      if (errorObj.isSet) {
        temp[currentCard] = -1;

        // Only show retry when the error is other than not fset
        if (verified !== -1 || pairingFailed) {
          setShowRetry(true);
        }

        // setErrorMsg(errorMessage);
      } else if (verified === 2 && !pairingFailed) {
        temp[currentCard] = verified;
        setCurrentCard(incrementCurrentCard);
        resetHooks();
      } else {
        // setErrorMsg('Some internal error occurred');
        setShowRetry(true);
      }
    }
    setCardsAuth(temp);
  }, [completed]);

  useEffect(() => {
    if (currentCard !== '00') {
      const temp = { ...cardsAuth };
      temp[currentCard] = 1;
      setCardsAuth(temp);
      if (deviceConnection && firmwareVersion) {
        handleCardAuth({
          connection: deviceConnection,
          sdkVersion: deviceSdkVersion,
          cardNumber: currentCard,
          isTestApp: inTestApp(deviceState)
        });
      }
    }
  }, [currentCard]);

  const timeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const onRetry = () => {
    setShowRetry(false);
    clearErrorObj();

    if (deviceConnectionState !== DeviceConnectionState.IN_TEST_APP) {
      setShowRetry(true);
      const cyError = new CyError(CysyncError.DEVICE_IN_TEST_APP);
      setErrorObj(
        handleErrors(errorObj, cyError, flowName, { deviceConnectionState })
      );
      return;
    }

    const temp = { ...cardsAuth };

    if (currentCard === '00') {
      return;
    }

    if (deviceConnection) {
      temp[currentCard] = 1;
    } else {
      temp[currentCard] = 0;
    }
    setCardsAuth(temp);

    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = undefined;
    }

    timeout.current = setTimeout(() => {
      if (deviceConnection && firmwareVersion) {
        handleCardAuth({
          connection: deviceConnection,
          sdkVersion: deviceSdkVersion,
          cardNumber: currentCard,
          isTestApp: inTestApp(deviceState)
        });
      }
    }, 500);
  };

  const handleCardAuth = async ({
    connection,
    sdkVersion,
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
      const cyError = new CyError(CysyncError.UNKNOWN_CARD_ERROR);
      setErrorObj(handleErrors(errorObj, cyError, flowName));
    });

    cardAuth.on('error', err => {
      const cyError = new CyError();
      if (err.isAxiosError) {
        setNetworkError(true);
        handleAxiosErrors(cyError, err);
      } else if (err instanceof DeviceError) {
        handleDeviceErrors(cyError, err, flowName);
      } else {
        cyError.setError(CysyncError.CARD_AUTH_UNKNOWN_ERROR);
      }
      setErrorObj(handleErrors(errorObj, cyError, flowName, { err }));
    });

    cardAuth.on('acceptedRequest', acceptedRequest => {
      if (acceptedRequest) {
        setRequestStatus(2);
        setVerified(1);
      } else {
        const cyError = new CyError(CysyncError.CARD_AUTH_REJECTED);
        setErrorObj(handleErrors(errorObj, cyError, flowName));
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
        setVerified(-1);
        setProcessStatus(-1);
        const cyError = new CyError(CysyncError.CARD_AUTH_FAILED);
        setErrorObj(handleErrors(errorObj, cyError, flowName));
      }
    });

    cardAuth.on('pairingFailed', () => {
      setPairingFailed(true);
      setProcessStatus(-1);
      const cyError = new CyError(CysyncError.CARD_PAIRING_FAILED);
      setErrorObj(handleErrors(errorObj, cyError, flowName));
    });

    cardAuth.on('notReady', () => {
      const cyError = new CyError();
      if (isInitial) {
        cyError.setError(CysyncError.DEVICE_NOT_READY_IN_INITIAL);
      } else {
        cyError.setError(CysyncError.DEVICE_NOT_READY);
      }
      setErrorObj(handleErrors(errorObj, cyError, flowName));
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
        firmwareVersion: hexToVersion(firmwareVersion),
        cardNumber,

        isTestApp
      });
      setIsInFlow(false);
      logger.info('CardAuth: completed.');
      // Solely for UI purpose, to wait and give a UX feeback
      await sleep(1000);
      setCompleted(true);
    } catch (e) {
      setIsInFlow(false);
      setCompleted(true);
      const cyError = new CyError(CysyncError.CARD_AUTH_UNKNOWN_ERROR);
      setErrorObj(handleErrors(errorObj, cyError, flowName, { e }));
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

  const { showFeedback, closeFeedback } = useFeedback();

  const newFeedbackState: FeedbackState = {
    attachLogs: true,
    attachDeviceLogs: false,
    categories: ['Report'],
    category: 'Report',
    description: errorObj.showError(),
    descriptionError: '',
    email: '',
    emailError: '',
    subject: 'Reporting for Error (X1 Card Authentication)',
    subjectError: ''
  };

  useEffect(() => {
    return () => {
      closeFeedback();
    };
  }, []);

  const handleFeedbackOpen = () => {
    showFeedback({
      isContact: true,
      heading: 'Report',
      initFeedbackState: newFeedbackState
    });
  };

  const clearErrorObj = () => {
    setErrorObj(new CyError());
  };

  return {
    handleCardAuth,
    requestStatus,
    processStatus,
    verified,
    isCardError,
    isNetworkError,
    errorObj,
    clearErrorObj,
    handleFeedbackOpen,
    cardsAuth,
    connStatus,
    cardsStatus,
    showRetry,
    enableRetry,
    enableRetryErrorMsg,
    onRetry,
    setCardsStatus,
    completed,
    resetHooks,
    cancelCardAuth,
    pairingFailed
  } as UseCardAuthValues;
};
