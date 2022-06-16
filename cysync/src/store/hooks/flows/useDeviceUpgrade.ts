import {
  createPort,
  DeviceConnection,
  DeviceError,
  DeviceErrorType
} from '@cypherock/communication';
import { DeviceUpdater } from '@cypherock/protocols';
import { stmFirmware as firmwareServer } from '@cypherock/server-wrapper';
import { ipcRenderer } from 'electron';
import React, { useEffect } from 'react';

import {
  getFirmwareHex,
  hexToVersion,
  inTestApp
} from '../../../utils/compareVersion';
import logger from '../../../utils/logger';
import {
  ConnectionContextInterface,
  useConnection,
  useI18n
} from '../../provider';

import { useDeviceAuth } from './useDeviceAuth';

export interface UseDeviceUpgradeValues {
  startDeviceUpdate: () => void;
  handleRetry: () => void;
  handleDeviceUpgrade: () => Promise<void>;
  deviceConnection: ConnectionContextInterface['deviceConnection'];
  inBackgroundProcess: ConnectionContextInterface['inBackgroundProcess'];
  firmwareVersion: ConnectionContextInterface['firmwareVersion'];
  deviceState: ConnectionContextInterface['deviceState'];
  isCompleted: 0 | 1 | -1 | 2;
  setIsCompleted: React.Dispatch<React.SetStateAction<number>>;
  displayErrorMessage: string;
  setDisplayErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  isDeviceUpdating: boolean;
  setIsDeviceUpdating: ConnectionContextInterface['setIsDeviceUpdating'];
  setBlockNewConnection: ConnectionContextInterface['setBlockNewConnection'];
  updateDownloaded: 0 | 1 | -1 | 2;
  beforeFlowStart: ConnectionContextInterface['beforeFlowStart'];
  isApproved: 0 | 1 | -1 | 2;
  setApproved: React.Dispatch<React.SetStateAction<number>>;
  isInternetSlow: boolean;
  isUpdated: number;
  setDeviceSerial: ConnectionContextInterface['setDeviceSerial'];
  verified: number;
  errorMessage: string;
  completed: boolean;
  resetHooks: () => void;
  latestVersion: string;
  setLatestVersion: React.Dispatch<React.SetStateAction<string>>;
  setUpdated: React.Dispatch<React.SetStateAction<number>>;
  cancelDeviceUpgrade: (connection: DeviceConnection) => void;
}

export type UseDeviceUpgrade = (isInitial?: boolean) => UseDeviceUpgradeValues;

export const useDeviceUpgrade: UseDeviceUpgrade = (isInitial?: boolean) => {
  const {
    handleDeviceAuth,
    verified,
    completed,
    resetHooks,
    setErrorMessage,
    errorMessage
  } = useDeviceAuth();

  const {
    internalDeviceConnection: deviceConnection,
    deviceSdkVersion,
    deviceState,
    beforeFlowStart,
    firmwareVersion,
    inBootloader,
    setIsDeviceUpdating,
    isDeviceUpdating,
    setDeviceSerial,
    inBackgroundProcess,
    setIsInFlow,
    setBlockNewConnection
  } = useConnection();

  const deviceUpdater = new DeviceUpdater();
  const { langStrings } = useI18n();

  const [isCompleted, setIsCompleted] = React.useState<-1 | 0 | 1 | 2>(0);
  const [displayErrorMessage, setDisplayErrorMessage] = React.useState('');
  const [isApproved, setApproved] = React.useState<-1 | 0 | 1 | 2>(0);
  const [isUpdated, setUpdated] = React.useState<-1 | 0 | 1 | 2>(0);
  const [updateDownloaded, setUpdateDownloaded] = React.useState<
    -1 | 0 | 1 | 2
  >(1);
  const [latestVersion, setLatestVersion] = React.useState('0.0.0');
  const [firmwarePath, setFirmwarePath] = React.useState('');
  const [isInternetSlow, setIsInternetSlow] = React.useState(false);
  const internetSlowTimeout = React.useRef<NodeJS.Timeout | undefined>(
    undefined
  );

  const waitForCancel = React.useRef(false);
  const alreadyCancelled = React.useRef(false);

  const startDeviceUpdate = () => {
    alreadyCancelled.current = false;
    waitForCancel.current = false;

    setApproved(0);
    setIsCompleted(0);
    setUpdated(0);
    setUpdateDownloaded(0);
    setLatestVersion('0.0.0');
    setFirmwarePath('');
    setIsInternetSlow(false);
    setDisplayErrorMessage('');
    resetHooks();
    setErrorMessage('');

    setUpdateDownloaded(1);

    logger.info('Initiating device update from settings');

    if (!beforeFlowStart(true)) {
      setDisplayErrorMessage(langStrings.ERRORS.DEVICE_NOT_CONNECTED);
      setIsCompleted(-1);
      return;
    }

    setIsDeviceUpdating(true);
    setBlockNewConnection(true);

    firmwareServer
      .getLatest()
      .request()
      .then(response => {
        setLatestVersion(response.data.firmware.version);
        logger.verbose(
          `Device update available for version: ${response.data.firmware.version}`
        );
        /**
         * This check is to prevent restarting the whole upgrade process if the user
         * disconnects the device right after the firmware upgrade but not before
         * device auth is done. This is only done on Initial app of Cysync as we have
         * global popups on Main app of Cysync to handle this.
         */
        if (
          response.data.firmware.version === hexToVersion(firmwareVersion) &&
          deviceState === '02' &&
          isInitial
        ) {
          logger.verbose(`Device already on the latest version`);
          setUpdated(2);
          return null;
        }
        internetSlowTimeout.current = setTimeout(() => {
          logger.verbose('Setting internet Slow.');
          setIsInternetSlow(true);
        }, 5000);
        ipcRenderer.send('download', {
          url: response.data.firmware.downloadUrl,
          properties: {
            directory: `${process.env.userDataPath}`,
            filename: 'app_dfu_package.bin'
          }
        });
        return null;
      })
      .catch(error => {
        logger.error('Error in getting firmware version');
        logger.error(error);
        if (error && error.response) {
          setDisplayErrorMessage(langStrings.ERRORS.NETWORK_ERROR);
        } else {
          setDisplayErrorMessage(
            langStrings.ERRORS.NETWORK_ERROR_WITH_NO_RESPONSE
          );
        }
        setUpdateDownloaded(-1);
        setIsCompleted(-1);
        setBlockNewConnection(false);
        setIsDeviceUpdating(false);
        if (internetSlowTimeout.current) {
          clearTimeout(internetSlowTimeout.current);
          internetSlowTimeout.current = undefined;
        }
      });

    ipcRenderer.on('download complete', (_event, filePath) => {
      logger.info('Firmware downloaded successfully');
      setFirmwarePath(filePath);
      setUpdateDownloaded(2);
      if (internetSlowTimeout.current) {
        clearTimeout(internetSlowTimeout.current);
        internetSlowTimeout.current = undefined;
      }
    });

    ipcRenderer.on('download error', error => {
      logger.error('Error in downloading firmware');
      logger.error(error);
      setDisplayErrorMessage(
        langStrings.ERRORS.DEVICE_UPGRADE_FIRMWARE_DOWNLOAD_FAILED
      );
      setIsCompleted(-1);
      setBlockNewConnection(false);
      setIsDeviceUpdating(false);
      setUpdateDownloaded(-1);
    });
  };

  const handleRetry = () => {
    logger.info('DeviceUpgrade: Retrying Device Upgrade');
    startDeviceUpdate();
  };

  const cancelDeviceUpgrade = async (connection: DeviceConnection) => {
    alreadyCancelled.current = true;
    deviceUpdater
      .cancel(connection)
      .then(() => {
        setIsDeviceUpdating(false);
        setBlockNewConnection(false);
        logger.info('DeviceUpgrade: Cancelled');
      })
      .catch(e => {
        setIsDeviceUpdating(false);
        setBlockNewConnection(false);
        logger.error('DeviceUpgrade: Error in flow cancel');
        logger.error(e);
      });
  };

  const handleDeviceUpgrade = async () => {
    if (!deviceConnection) {
      logger.error('Device is not connected');
      setDisplayErrorMessage(langStrings.ERRORS.DEVICE_NOT_CONNECTED);
      setUpdated(-1);
      setApproved(-1);
      setIsCompleted(-1);
      setIsDeviceUpdating(false);
      setBlockNewConnection(false);
      deviceUpdater.removeAllListeners();
      return;
    }

    deviceUpdater.on('completed', () => {
      logger.info('Device Update completed');
      setUpdated(2);
      deviceUpdater.removeAllListeners();
    });

    deviceUpdater.on('updateConfirmed', (val: boolean) => {
      if (val) {
        logger.info('Device update confirmed');
        setApproved(2);
        setIsCompleted(1);
      } else {
        logger.info('Device update rejected');
        setApproved(-1);
        setDisplayErrorMessage(langStrings.ERRORS.DEVICE_UPGRADE_REJECTED);
        setIsCompleted(-1);
        setBlockNewConnection(false);
        setIsDeviceUpdating(false);
        deviceUpdater.removeAllListeners();
      }
    });

    deviceUpdater.on('notReady', () => {
      logger.info('DeviceUpgrade: Device not ready');
      if (isInitial) {
        setDisplayErrorMessage(langStrings.ERRORS.DEVICE_NOT_READY_IN_INITIAL);
      } else {
        setDisplayErrorMessage(langStrings.ERRORS.DEVICE_NOT_READY);
      }

      setUpdated(-1);
      setApproved(-1);
      setIsCompleted(-1);
      setBlockNewConnection(false);
      setIsDeviceUpdating(false);
      deviceUpdater.removeAllListeners();
    });

    deviceUpdater.on('error', err => {
      waitForCancel.current = true;
      logger.info('Error on Device update');
      logger.error(err);
      if (err instanceof DeviceError) {
        if (
          [
            DeviceErrorType.CONNECTION_CLOSED,
            DeviceErrorType.CONNECTION_NOT_OPEN
          ].includes(err.errorType)
        ) {
          setDisplayErrorMessage(
            langStrings.ERRORS.DEVICE_DISCONNECTED_IN_FLOW
          );
        } else if (err.errorType === DeviceErrorType.NOT_CONNECTED) {
          setDisplayErrorMessage(langStrings.ERRORS.DEVICE_NOT_CONNECTED);
        } else if (
          [
            DeviceErrorType.WRITE_TIMEOUT,
            DeviceErrorType.READ_TIMEOUT
          ].includes(err.errorType)
        ) {
          setDisplayErrorMessage(langStrings.ERRORS.DEVICE_TIMEOUT_ERROR);
        } else {
          setDisplayErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
        }
      } else {
        setDisplayErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
      }
      setUpdated(-1);
      setApproved(-1);
      setIsCompleted(-1);
      setIsDeviceUpdating(false);
      deviceUpdater.removeAllListeners();
    });

    deviceUpdater.on('failed', () => {
      logger.info('Error on Device update');
      setUpdated(-1);
      setApproved(-1);
      setIsCompleted(-1);
      setIsDeviceUpdating(false);
      setBlockNewConnection(false);
      setDisplayErrorMessage(langStrings.ERRORS.DEVICE_UPGRADE_FAILED);
      deviceUpdater.removeAllListeners();
    });

    try {
      setIsInFlow(true);
      setIsDeviceUpdating(true);
      setBlockNewConnection(true);
      /**
       * Error will be thrown in rare conditions where the implementation
       * itself has broken.
       */
      await deviceUpdater.run({
        connection: deviceConnection,
        sdkVersion: deviceSdkVersion,
        firmwareVersion: getFirmwareHex(latestVersion),
        firmwarePath,
        inBootloaderMode: inBootloader
      });
      setIsInFlow(false);
      logger.info('DeviceUpgrade: completed.');
    } catch (e) {
      setIsInFlow(true);
      logger.error('DeviceUpgrade: Some error occurred.');
      logger.error(e);
      setDisplayErrorMessage(langStrings.ERRORS.UNKNOWN_FLOW_ERROR);
      deviceUpdater.removeAllListeners();
      setIsDeviceUpdating(false);
      setBlockNewConnection(false);
    }

    if (waitForCancel.current && !alreadyCancelled.current) {
      setBlockNewConnection(false);
    }
  };

  useEffect(() => {
    if (updateDownloaded === 2) {
      logger.info('Running device update');
      if (!beforeFlowStart(true)) {
        setDisplayErrorMessage(langStrings.ERRORS.DEVICE_NOT_CONNECTED);
        setIsCompleted(-1);
        setIsDeviceUpdating(false);
        setBlockNewConnection(false);
        return;
      }
      setIsDeviceUpdating(true);
      setBlockNewConnection(true);
      setApproved(1);
      handleDeviceUpgrade();
    }
  }, [updateDownloaded]);

  // Trigger device auth when firmware version has changed,
  // update is completed and there is a device connection
  const timeout = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const retries = React.useRef<number>(1);
  const MAX_RETRIES = 3;

  const initiateDeviceAuth = async () => {
    let connection: DeviceConnection;
    try {
      logger.info('In Device update timeout');

      ({ connection } = await createPort());
      if (!connection) {
        throw new Error('Device not connected');
      }

      logger.info('Initiating auth');

      await connection.beforeOperation();
      await connection.selectPacketVersion();

      handleDeviceAuth({
        connection,
        sdkVersion: deviceSdkVersion,
        setIsInFlow: () => {
          // empty
        },
        firmwareVersion: latestVersion,
        setDeviceSerial,
        inTestApp: inTestApp(connection.deviceState)
      });
    } catch (error) {
      if (connection) {
        connection.afterOperation().catch(logger.error);
      }

      retries.current += 1;

      if (retries.current > MAX_RETRIES) {
        logger.warn('Error in device auth, max retries exceeded.');
        logger.error(error);
        setDisplayErrorMessage(
          langStrings.ERRORS.DEVICE_UPGRADE_CONNECTION_FAILED_IN_AUTH
        );
        setIsCompleted(-1);
        setIsDeviceUpdating(false);
        setBlockNewConnection(false);
      } else {
        logger.warn('Error in device auth, retrying...');
        logger.error(error);

        if (timeout.current) {
          clearTimeout(timeout.current);
          timeout.current = undefined;
        }

        timeout.current = setTimeout(initiateDeviceAuth, 2000);
      }
    }
  };

  useEffect(() => {
    if (isUpdated === 2) {
      logger.info('Device update process complete, initiating device auth');
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = undefined;
      }

      // Additional delay for device to become active
      timeout.current = setTimeout(initiateDeviceAuth, 10000);
    }
  }, [isUpdated]);

  useEffect(() => {
    if (verified === -1 || errorMessage) {
      retries.current += 1;

      if (verified === -1 || retries.current > MAX_RETRIES) {
        if (verified === -1) {
          logger.warn('Device auth failed');
        } else {
          logger.warn('Error in device auth, max retries exceeded.');
        }
        setDisplayErrorMessage(
          errorMessage || langStrings.ERRORS.DEVICE_AUTH_FAILED
        );
        setIsCompleted(-1);
        setIsDeviceUpdating(false);
        setBlockNewConnection(false);
      } else {
        logger.warn('Error in device auth, retrying...');
        logger.warn(errorMessage);

        if (timeout.current) {
          clearTimeout(timeout.current);
          timeout.current = undefined;
        }

        timeout.current = setTimeout(initiateDeviceAuth, 2000);
      }
    } else if (completed && verified === 2) {
      logger.info('Device auth completed');
      setIsCompleted(2);
      setTimeout(() => {
        setIsDeviceUpdating(false);
        setBlockNewConnection(false);
      }, 500);
      resetHooks();
    }
  }, [verified, errorMessage, completed]);

  return {
    startDeviceUpdate,
    handleRetry,
    handleDeviceUpgrade,
    handleDeviceAuth,
    cancelDeviceUpgrade,
    deviceConnection,
    inBackgroundProcess,
    firmwareVersion,
    deviceState,
    isCompleted,
    setIsCompleted,
    displayErrorMessage,
    setDisplayErrorMessage,
    setIsDeviceUpdating,
    setBlockNewConnection,
    updateDownloaded,
    beforeFlowStart,
    isApproved,
    setApproved,
    isInternetSlow,
    isUpdated,
    setDeviceSerial,
    verified,
    errorMessage,
    completed,
    resetHooks,
    latestVersion,
    setLatestVersion,
    setUpdated,
    isDeviceUpdating
  } as UseDeviceUpgradeValues;
};
