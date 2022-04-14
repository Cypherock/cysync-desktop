import {
  DeviceConnection,
  DeviceError,
  DeviceErrorType
} from '@cypherock/communication';
import { LogsFetcher } from '@cypherock/protocols';
import { useState } from 'react';

import logger from '../../../utils/logger';
import { useI18n } from '../../provider';

export interface HandleLogFetcherOptions {
  connection: DeviceConnection;
  sdkVersion: string;
  setIsInFlow: (val: boolean) => void;
  firmwareVersion: string;
}

export interface UseLogFetcherValues {
  handleLogFetch: (options: HandleLogFetcherOptions) => Promise<void>;
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  completed: boolean;
  requestStatus: number;
  logFetched: number;
  resetHooks: () => void;
  cancelLogFetcher: (connection: DeviceConnection) => void;
}

export type UseLogFetcher = () => UseLogFetcherValues;

export const useLogFetcher: UseLogFetcher = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [completed, setCompleted] = useState(false);
  const [requestStatus, setRequestStatus] = useState<-1 | 0 | 1 | 2>(0);
  const [logFetched, setLogFetched] = useState<-1 | 0 | 1 | 2>(0);
  const logFetcher = new LogsFetcher();

  const { langStrings } = useI18n();

  // To call resetHooks outside of this function
  const resetHooks = () => {
    setLogFetched(0);
    setRequestStatus(0);
    setCompleted(false);
    logFetcher.removeAllListeners();
  };

  const handleLogFetch = async ({
    connection,
    sdkVersion,
    setIsInFlow,
    firmwareVersion
  }: HandleLogFetcherOptions) => {
    resetHooks();

    logger.info('LogFetcher: initiated');

    setLogFetched(0);
    setRequestStatus(1);
    setCompleted(false);

    logFetcher.on('connectionOpen', () => {
      logger.info('LogFetcher: Connection Opened');
    });

    logFetcher.on('connectionClose', () => {
      logger.info('LogFetcher: Connection Closed');
    });

    logFetcher.on('error', err => {
      setRequestStatus(-1);
      setLogFetched(-1);
      setCompleted(true);
      logger.error('LogFetcher: Error occurred');
      logger.error(err);
      if (err instanceof DeviceError) {
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
          setErrorMessage(langStrings.ERRORS.LOG_FETCHER_FAILED);
        }
      } else {
        setErrorMessage(langStrings.ERRORS.LOG_FETCHER_FAILED);
      }
    });

    logFetcher.on('loggingDisabled', () => {
      logger.info('LogFetcher: Logging disabled on device.');
      setRequestStatus(-1);
      setLogFetched(-1);
      setErrorMessage(langStrings.ERRORS.LOG_FETCHER_DISABLED_ON_DEVICE);
    });

    logFetcher.on('acceptedRequest', acceptedRequest => {
      if (acceptedRequest) {
        logger.info('LogFetcher: Confirmed from device');
        setRequestStatus(2);
        setLogFetched(1);
      } else {
        logger.info('LogFetcher: Rejected from device');
        setRequestStatus(-1);
        setLogFetched(-1);
        setErrorMessage(langStrings.ERRORS.LOG_FETCHER_REJECTED);
      }
    });

    logFetcher.on('completed', (v: boolean) => {
      if (v) {
        logger.info('LogFetcher: Completed');
        setLogFetched(2);
      }
    });

    logFetcher.on('notReady', () => {
      logger.info('LogFetcher: Device Not Ready');
      setRequestStatus(-1);
      setLogFetched(-1);
      setErrorMessage(langStrings.ERRORS.DEVICE_NOT_READY);
    });

    try {
      setIsInFlow(true);
      await logFetcher.run({
        connection,
        sdkVersion,
        firmwareVersion
      });
      setIsInFlow(false);
      logger.info('LogFetcher: completed.');
      setCompleted(true);
    } catch (e) {
      setIsInFlow(false);
      logger.error('LogFetcher: Some error occurred.');
      logger.error(e);
      setErrorMessage(langStrings.ERRORS.LOG_FETCHER_FAILED);
      setRequestStatus(-1);
      setLogFetched(-1);
      setCompleted(true);
      logFetcher.removeAllListeners();
    }
  };

  const cancelLogFetcher = async (connection: DeviceConnection) => {
    return logFetcher
      .cancel(connection)
      .then(() => logger.info('LogFetcher: Cancelled'))
      .catch(e => {
        logger.error('LogFetcher: Error in flow cancel');
        logger.error(e);
      });
  };

  return {
    errorMessage,
    setErrorMessage,
    cancelLogFetcher,
    handleLogFetch,
    resetHooks,
    logFetched,
    completed,
    requestStatus
  };
};
