import {
  DeviceConnection,
  DeviceError,
  DeviceErrorType
} from '@cypherock/communication';
import {
  ALL_SUPPORTED_SDK_VERSIONS,
  GetDeviceInfo
} from '@cypherock/protocols';
import { useState } from 'react';

import logger from '../../../utils/logger';
import { deviceDb } from '../../database';
import { useI18n } from '../../provider';

export type UpdateRequiredType = 'app' | 'device' | 'all' | undefined;

export interface HandleGetDeviceInfoOptions {
  connection: DeviceConnection;
  setIsInFlow: (val: boolean) => void;
  setFirmwareVersion: (val: string) => void;
  setDeviceSerial: (val: string) => void;
  setSdkVersion: (val: string) => void;
}

export interface UseGetDeviceInfoValues {
  errorMessage: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  authenticated: number;
  completed: boolean;
  isNewDevice: boolean;
  lastAuthFailed: boolean;
  isNotReady: boolean;
  handleGetDeviceInfo: (options: HandleGetDeviceInfoOptions) => Promise<void>;
  resetHooks: () => void;
  isUpdateRequired: UpdateRequiredType;
}

export type UseGetDeviceInfo = () => UseGetDeviceInfoValues;

export const useGetDeviceInfo: UseGetDeviceInfo = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [authenticated, setAuthenticated] = useState<-1 | 0 | 1 | 2>(0);
  const [lastAuthFailed, setLastAuthFailed] = useState(false);
  const [isNewDevice, setIsNewDevice] = useState(false);
  const [isUpdateRequired, setIsUpdateRequired] =
    useState<UpdateRequiredType>(undefined);
  const [isNotReady, setIsNotReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  const getDeviceInfo = new GetDeviceInfo();

  const { langStrings } = useI18n();

  // To call resetHooks outside of this function
  const resetHooks = () => {
    setCompleted(false);
    setAuthenticated(0);
    setIsNewDevice(false);
    setIsNotReady(false);
    setIsUpdateRequired(undefined);
    setLastAuthFailed(false);
    getDeviceInfo.removeAllListeners();
  };

  const handleGetDeviceInfo = async ({
    connection,
    setIsInFlow,
    setFirmwareVersion,
    setDeviceSerial,
    setSdkVersion
  }: HandleGetDeviceInfoOptions) => {
    resetHooks();

    setErrorMessage('');
    logger.info('GetDeviceInfo: Initiated');
    setAuthenticated(1);

    getDeviceInfo.on('connectionOpen', () => {
      logger.info('GetDeviceInfo: Connection Opened');
    });

    getDeviceInfo.on('connectionClose', () => {
      logger.info('GetDeviceInfo: Connection Closed');
    });

    getDeviceInfo.on('error', err => {
      logger.error('GetDeviceInfo: Error occurred');
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
          setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
        }
      } else {
        setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
      }
    });

    getDeviceInfo.on('sdkVersion', (sdkVersion: string) => {
      logger.info('GetDeviceInfo: Got sdk version', { sdkVersion });
      setSdkVersion(sdkVersion);
    });

    getDeviceInfo.on('sdkNotSupported', (updateFor: string) => {
      if (updateFor === 'app') {
        setIsUpdateRequired('app');
      } else if (updateFor === 'device') {
        setIsUpdateRequired('device');
      } else {
        setIsUpdateRequired('all');
      }

      logger.error(
        `GetDeviceInfo: This SDK version is not supported. Supported SDK versions are ${ALL_SUPPORTED_SDK_VERSIONS.join(
          ','
        )}`,
        { updateFor }
      );
      setErrorMessage(langStrings.ERRORS.DEVICE_NOT_SUPPORTED);
    });

    getDeviceInfo.on('serial', (serial: string) => {
      logger.info('GetDeviceInfo: Got serial', { serial });
      setDeviceSerial(serial);
    });

    getDeviceInfo.on('firmwareVersion', (firmwareV: string) => {
      logger.info('GetDeviceInfo: Got firmwareVersion', { firmwareV });
      setFirmwareVersion(firmwareV);
    });

    getDeviceInfo.on('isNew', () => {
      logger.info('GetDeviceInfo: Is new device');
      setIsNewDevice(true);
    });

    getDeviceInfo.on('lastAuth', (v: boolean) => {
      const lastStatus = !v;
      logger.info('GetDeviceInfo: Last Auth failed status', { lastStatus });
      setLastAuthFailed(lastStatus);
    });

    getDeviceInfo.on('auth', (v: boolean) => {
      if (v) {
        logger.info('GetDeviceInfo: Device verified');
        setAuthenticated(2);
      } else {
        logger.info('GetDeviceInfo: Device not verified');
        setAuthenticated(-1);
      }
    });

    getDeviceInfo.on('notReady', () => {
      setIsNotReady(true);
      logger.info('GetDeviceInfo: Device not ready.');
      setErrorMessage(langStrings.ERRORS.DEVICE_NOT_READY);
    });

    try {
      setIsInFlow(true);
      /**
       * Error will be thrown in rare conditions where the implementation
       * itself has broken.
       */
      await getDeviceInfo.run({
        connection,
        sdkVersion: '',
        deviceDB: deviceDb
      });
      setIsInFlow(false);
      logger.info('GetDeviceInfo: Completed.');
      setCompleted(true);
    } catch (e) {
      setIsInFlow(false);
      getDeviceInfo.removeAllListeners();
      logger.error('GetDeviceInfo: Some error occurred.');
      logger.error(e);
      setErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
      setCompleted(true);
    }
  };

  return {
    errorMessage,
    setErrorMessage,
    handleGetDeviceInfo,
    resetHooks,
    authenticated,
    completed,
    isNewDevice,
    lastAuthFailed,
    isNotReady,
    isUpdateRequired
  } as UseGetDeviceInfoValues;
};
