import { DeviceConnection, DeviceError } from '@cypherock/communication';
import { Device } from '@cypherock/database';
import { DeviceAuthenticator } from '@cypherock/protocols';
import { useEffect, useState } from 'react';

import {
  CyError,
  CysyncError,
  DisplayError,
  handleAxiosErrors,
  handleDeviceErrors,
  handleErrors
} from '../../../errors';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';
import { deviceDb } from '../../database';
import { FeedbackState, useConnection, useFeedback } from '../../provider';

export interface HandleDeviceAuthOptions {
  connection: DeviceConnection;
  sdkVersion: string;
  setIsInFlow: (val: boolean) => void;
  firmwareVersion: string;
  setDeviceSerial: (val: string) => void;
  inTestApp: boolean;
}

export interface UseDeviceAuthValues {
  handleDeviceAuth: (options: HandleDeviceAuthOptions) => Promise<void>;
  verified: 0 | -1 | 1 | 2;
  errorObj: CyError;
  setErrorObj: React.Dispatch<React.SetStateAction<DisplayError>>;
  clearErrorObj: () => void;
  completed: boolean;
  confirmed: 0 | -1 | 1 | 2;
  resetHooks: () => void;
  cancelDeviceAuth: (connection: DeviceConnection) => void;
  handleFeedbackOpen: () => void;
}

export type UseDeviceAuth = (isInitial?: boolean) => UseDeviceAuthValues;

const flowName = Analytics.Categories.DEVICE_AUTH;

export const useDeviceAuth: UseDeviceAuth = isInitial => {
  const [errorObj, setErrorObj] = useState<CyError>(new CyError());
  const [verified, setVerified] = useState<-1 | 0 | 1 | 2>(0);
  const [confirmed, setConfirmed] = useState<-1 | 0 | 1 | 2>(0);
  const [completed, setCompleted] = useState(false);
  const deviceAuth = new DeviceAuthenticator();

  const { showFeedback, closeFeedback } = useFeedback();
  const { setDeviceConnectionStatus, deviceConnection } = useConnection();

  let deviceSerial: string | null = null;

  // To call resetHooks outside of this function
  const resetHooks = () => {
    deviceSerial = null;
    setVerified(0);
    setConfirmed(0);
    setCompleted(false);
    deviceAuth.removeAllListeners();
  };

  useEffect(() => {
    if (completed && !deviceConnection) {
      setDeviceConnectionStatus(false);
    }
  }, [completed]);

  const onDeviceAuthenticate = (firmwareVersion: string, auth: boolean) => {
    try {
      logger.info('Device authenticated info', {
        deviceSerial,
        firmwareVersion,
        auth
      });
      if (!deviceSerial) {
        throw new Error('Device serial not found.');
      }
      const device: Device = {
        _id: deviceSerial,
        serial: deviceSerial,
        version: firmwareVersion,
        isAuth: auth
      };
      deviceDb.insert(device);
    } catch (error) {
      logger.error('Error while inserting device auth data');
      logger.error(error);
    }
  };

  const handleDeviceAuth = async ({
    connection,
    sdkVersion,
    setIsInFlow,
    firmwareVersion,
    setDeviceSerial,
    inTestApp
  }: HandleDeviceAuthOptions) => {
    // Mock device auth flow
    const mockAuth =
      process.env.BUILD_TYPE === 'debug' &&
      localStorage.getItem('disableProvision') === 'true';

    setConfirmed(1);
    setErrorObj(new CyError());
    logger.info('DeviceAuth: initiated');
    if (mockAuth) {
      logger.info('DeviceAuth: Mocking device auth in debug build');
    }

    deviceAuth.on('connectionOpen', () => {
      logger.info('DeviceAuth: Connection Opened');
    });

    deviceAuth.on('connectionClose', () => {
      logger.info('DeviceAuth: Connection Closed');
    });

    deviceAuth.on('error', err => {
      logger.error('DeviceAuth: Error occurred in device auth flow');
      const cyError = new CyError();
      if (err.isAxiosError) {
        handleAxiosErrors(cyError, err);
      } else if (err instanceof DeviceError) {
        handleDeviceErrors(cyError, err, flowName);
      } else {
        // unknown flow error
        cyError.setError(CysyncError.DEVICE_AUTH_UNKNOWN_ERROR);
      }
      setErrorObj(handleErrors(errorObj, cyError, flowName, { err }));
    });

    deviceAuth.on('confirmed', (v: boolean) => {
      if (v) {
        logger.info('DeviceAuth: Confirmed from device');
        setConfirmed(2);
        setVerified(1);
      } else {
        logger.info('DeviceAuth: Rejected from device');
        const cyError = new CyError(CysyncError.DEVICE_AUTH_REJECTED);
        setErrorObj(handleErrors(errorObj, cyError, flowName));
        setConfirmed(-1);
      }
    });

    deviceAuth.on('serial', (serial: string) => {
      logger.info('DeviceAuth: Got serial', { serial });
      deviceSerial = serial;
      setDeviceSerial(serial);
    });

    deviceAuth.on('verified', (v: boolean) => {
      onDeviceAuthenticate(firmwareVersion, v);
      if (v) {
        logger.info('DeviceAuth: verified');
        setVerified(2);
        setErrorObj(new CyError());
      } else {
        logger.info('DeviceAuth: not verified');
        setVerified(-1);
        const cyError = new CyError(CysyncError.DEVICE_AUTH_FAILED);
        setErrorObj(handleErrors(errorObj, cyError, flowName));
      }
    });

    deviceAuth.on('notReady', () => {
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
      await deviceAuth.run({
        connection,
        sdkVersion,
        firmwareVersion,
        mockAuth,
        inTestApp
      });
      setIsInFlow(false);
      logger.info('DeviceAuth: completed.');
      setCompleted(true);
    } catch (e) {
      setIsInFlow(false);
      const cyError = new CyError(CysyncError.DEVICE_AUTH_UNKNOWN_ERROR);
      setErrorObj(handleErrors(errorObj, cyError, flowName, { e }));
      deviceAuth.removeAllListeners();
    }
  };

  const cancelDeviceAuth = async (connection: DeviceConnection) => {
    return deviceAuth
      .cancel(connection)
      .then(canclled => {
        if (canclled) {
          logger.info('DeviceAuth: Cancelled');
        }
      })
      .catch(e => {
        logger.error('DeviceAuth: Error in flow cancel');
        logger.error(e);
      });
  };

  const handleFeedbackOpen = () => {
    const newFeedbackState: FeedbackState = {
      attachLogs: true,
      attachDeviceLogs: false,
      categories: ['Report'],
      category: 'Report',
      description: errorObj.getMessage(),
      descriptionError: '',
      email: '',
      emailError: '',
      subject: `Reporting for Error ${errorObj.getCode()} (Authenticating Device)`,
      subjectError: ''
    };

    showFeedback({
      isContact: true,
      heading: 'Report',
      initFeedbackState: newFeedbackState
    });
  };

  const clearErrorObj = () => {
    setErrorObj(new CyError());
  };

  useEffect(() => {
    return () => {
      closeFeedback();
    };
  }, []);

  return {
    errorObj,
    setErrorObj,
    clearErrorObj,
    cancelDeviceAuth,
    handleDeviceAuth,
    resetHooks,
    verified,
    completed,
    confirmed,
    handleFeedbackOpen
  } as UseDeviceAuthValues;
};
