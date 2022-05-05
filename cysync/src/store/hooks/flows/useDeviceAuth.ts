import {
  DeviceConnection,
  DeviceError,
  DeviceErrorType
} from '@cypherock/communication';
import { Device } from '@cypherock/database';
import { DeviceAuthenticator } from '@cypherock/protocols';
import { useState } from 'react';

import logger from '../../../utils/logger';
import { deviceDb } from '../../database';
import { useI18n } from '../../provider';

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
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  completed: boolean;
  confirmed: 0 | -1 | 1 | 2;
  resetHooks: () => void;
  cancelDeviceAuth: (connection: DeviceConnection) => void;
}

export type UseDeviceAuth = (isInitial?: boolean) => UseDeviceAuthValues;

export const useDeviceAuth: UseDeviceAuth = isInitial => {
  const [errorMessage, setErrorMessage] = useState('');
  const [verified, setVerified] = useState<-1 | 0 | 1 | 2>(0);
  const [confirmed, setConfirmed] = useState<-1 | 0 | 1 | 2>(0);
  const [completed, setCompleted] = useState(false);
  const deviceAuth = new DeviceAuthenticator();

  const { langStrings } = useI18n();
  let deviceSerial: string | null = null;

  // To call resetHooks outside of this function
  const resetHooks = () => {
    deviceSerial = null;
    setVerified(0);
    setConfirmed(0);
    setCompleted(false);
    deviceAuth.removeAllListeners();
  };

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
    setErrorMessage('');
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
      logger.error(err);
      if (err.isAxiosError) {
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

    deviceAuth.on('confirmed', (v: boolean) => {
      if (v) {
        logger.info('DeviceAuth: Confirmed from device');
        setConfirmed(2);
        setVerified(1);
      } else {
        logger.info('DeviceAuth: Rejected from device');
        setErrorMessage(langStrings.ERRORS.DEVICE_AUTH_REJECTED);
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
        setErrorMessage('');
      } else {
        logger.info('DeviceAuth: not verified');
        setVerified(-1);
        setErrorMessage(langStrings.ERRORS.DEVICE_AUTH_FAILED);
      }
    });

    deviceAuth.on('notReady', () => {
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
      logger.error('DeviceAuth: Some error occurred.');
      logger.error(e);
      setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
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

  return {
    errorMessage,
    setErrorMessage,
    cancelDeviceAuth,
    handleDeviceAuth,
    resetHooks,
    verified,
    completed,
    confirmed
  } as UseDeviceAuthValues;
};
