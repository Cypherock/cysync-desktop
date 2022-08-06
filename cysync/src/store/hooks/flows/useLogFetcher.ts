import { DeviceConnection, DeviceError } from '@cypherock/communication';
import { LogsFetcher } from '@cypherock/protocols';
import { useState } from 'react';

import {
  CyError,
  CysyncError,
  handleDeviceErrors,
  handleErrors
} from '../../../errors';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';

export interface HandleLogFetcherOptions {
  connection: DeviceConnection;
  sdkVersion: string;
  setIsInFlow: (val: boolean) => void;
  firmwareVersion: string;
}

export interface UseLogFetcherValues {
  handleLogFetch: (options: HandleLogFetcherOptions) => Promise<void>;
  errorObj: CyError;
  setErrorObj: (error: CyError) => void;
  clearErrorObj: () => void;
  completed: boolean;
  requestStatus: number;
  logFetched: number;
  resetHooks: () => void;
  cancelLogFetcher: (connection: DeviceConnection) => void;
}

export type UseLogFetcher = () => UseLogFetcherValues;

const flowName = Analytics.Categories.FETCH_LOG;

export const useLogFetcher: UseLogFetcher = () => {
  const [errorObj, setErrorObj] = useState<CyError>(new CyError());
  const [completed, setCompleted] = useState(false);
  const [requestStatus, setRequestStatus] = useState<-1 | 0 | 1 | 2>(0);
  const [logFetched, setLogFetched] = useState<-1 | 0 | 1 | 2>(0);
  const logFetcher = new LogsFetcher();

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
      const cyError = new CyError();
      if (err instanceof DeviceError) {
        handleDeviceErrors(errorObj, err, flowName);
      } else {
        cyError.setError(CysyncError.LOG_FETCHER_UNKNOWN_ERROR);
      }
      setErrorObj(handleErrors(errorObj, cyError, flowName, { err }));
    });

    logFetcher.on('loggingDisabled', () => {
      setRequestStatus(-1);
      setLogFetched(-1);
      const cyError = new CyError(CysyncError.LOG_FETCHER_DISABLED_ON_DEVICE);
      setErrorObj(handleErrors(errorObj, cyError, flowName));
    });

    logFetcher.on('acceptedRequest', acceptedRequest => {
      if (acceptedRequest) {
        logger.info('LogFetcher: Confirmed from device');
        setRequestStatus(2);
        setLogFetched(1);
      } else {
        setRequestStatus(-1);
        setLogFetched(-1);
        const cyError = new CyError(CysyncError.LOG_FETCHER_REJECTED);
        setErrorObj(handleErrors(errorObj, cyError, flowName));
      }
    });

    logFetcher.on('completed', (v: boolean) => {
      if (v) {
        logger.info('LogFetcher: Completed');
        setLogFetched(2);
      }
    });

    logFetcher.on('notReady', () => {
      setRequestStatus(-1);
      setLogFetched(-1);
      const cyError = new CyError(CysyncError.DEVICE_NOT_READY_IN_INITIAL);
      setErrorObj(handleErrors(errorObj, cyError, flowName));
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
      const cyError = new CyError(CysyncError.LOG_FETCHER_UNKNOWN_ERROR);
      setErrorObj(handleErrors(errorObj, cyError, flowName, { e }));
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
        logger.error(
          `${CysyncError.LOG_FETCHING_CANCEL_FAILED} LogFetcher: Error in flow cancel`
        );
        logger.error(e);
      });
  };

  const clearErrorObj = () => {
    setErrorObj(new CyError());
  };

  return {
    errorObj,
    clearErrorObj,
    cancelLogFetcher,
    handleLogFetch,
    resetHooks,
    logFetched,
    completed,
    requestStatus,
    setErrorObj
  };
};
