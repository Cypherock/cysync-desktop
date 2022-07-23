import {
  ALL_SUPPORTED_SDK_VERSIONS,
  DeviceConnection,
  DeviceError
} from '@cypherock/communication';
import { GetDeviceInfo } from '@cypherock/protocols';
import { useState } from 'react';

import {
  CyError,
  CysyncError,
  handleDeviceErrors,
  handleErrors
} from '../../../errors';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';
import { deviceDb } from '../../database';

export type UpdateRequiredType = 'app' | 'device' | 'all' | undefined;

export interface HandleGetDeviceInfoOptions {
  connection: DeviceConnection;
  setIsInFlow: (val: boolean) => void;
  setFirmwareVersion: (val: string) => void;
  setDeviceSerial: (val: string) => void;
  setSdkVersion: (val: string) => void;
}

export interface UseGetDeviceInfoValues {
  errorObj: CyError;
  clearErrorObj: () => void;
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

const flowName = Analytics.Categories.DEVICE_INFO;
export const useGetDeviceInfo: UseGetDeviceInfo = () => {
  const [errorObj, setErrorObj] = useState<CyError>(new CyError());
  const [authenticated, setAuthenticated] = useState<-1 | 0 | 1 | 2>(0);
  const [lastAuthFailed, setLastAuthFailed] = useState(false);
  const [isNewDevice, setIsNewDevice] = useState(false);
  const [isUpdateRequired, setIsUpdateRequired] =
    useState<UpdateRequiredType>(undefined);
  const [isNotReady, setIsNotReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  const getDeviceInfo = new GetDeviceInfo();

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

    setErrorObj(new CyError());
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
      const cyError = new CyError();
      if (err instanceof DeviceError) {
        handleDeviceErrors(cyError, err, flowName);
      } else {
        logger.error('Unknown error in get device info', err);
        cyError.setError(CysyncError.DEVICE_INFO_UNKNOWN_ERROR);
      }
      setErrorObj(handleErrors(errorObj, cyError));
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

      const cyError = new CyError(CysyncError.INCOMPATIBLE_DEVICE);
      setErrorObj(
        handleErrors(errorObj, cyError, flowName, {
          message: `GetDeviceInfo: This SDK version is not supported. Supported SDK versions are ${ALL_SUPPORTED_SDK_VERSIONS.join(
            ','
          )}`,
          updateFor
        })
      );
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
      const cyError = new CyError(CysyncError.DEVICE_NOT_READY);
      setErrorObj(handleErrors(errorObj, cyError, flowName));
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
      const cyError = new CyError(CysyncError.DEVICE_INFO_UNKNOWN_ERROR);
      setErrorObj(handleErrors(errorObj, cyError, flowName));
      setCompleted(true);
    }
  };

  const clearErrorObj = () => {
    setErrorObj(new CyError());
  };

  return {
    errorObj,
    clearErrorObj,
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
