import {
  createPort,
  DeviceError,
  DeviceErrorType,
  PacketVersion
} from '@cypherock/communication';
import { DeviceUpdater } from '@cypherock/protocols';
import { stmFirmware as firmwareServer } from '@cypherock/server-wrapper';
import { ipcRenderer } from 'electron';
import React, { useEffect } from 'react';
import SerialPort from 'serialport';

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
  devicePacketVersion: ConnectionContextInterface['devicePacketVersion'];
  inBackgroundProcess: ConnectionContextInterface['inBackgroundProcess'];
  firmwareVersion: ConnectionContextInterface['firmwareVersion'];
  deviceState: ConnectionContextInterface['deviceState'];
  isCompleted: 0 | 1 | -1 | 2;
  setIsCompleted: React.Dispatch<React.SetStateAction<number>>;
  displayErrorMessage: string;
  setDisplayErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  setIsDeviceUpdating: React.Dispatch<React.SetStateAction<boolean>>;
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
  cancelDeviceUpgrade: (
    connection: SerialPort,
    packetVersion: PacketVersion
  ) => void;
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
    devicePacketVersion,
    deviceState,
    beforeFlowStart,
    firmwareVersion,
    inBootloader,
    setIsDeviceUpdating,
    setDeviceSerial,
    inBackgroundProcess,
    setIsInFlow
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
  let internetSlowTimeout: NodeJS.Timeout | null = null;

  const startDeviceUpdate = () => {
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
    firmwareServer
      .getLatest()
      .then(response => {
        setLatestVersion(response.data.firmware.version);
        logger.verbose(
          `Device update available for version: ${response.data.firmware.version}`
        );
        internetSlowTimeout = setTimeout(() => {
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
        setIsDeviceUpdating(false);
        if (internetSlowTimeout !== null) {
          clearTimeout(internetSlowTimeout);
          internetSlowTimeout = null;
        }
      });

    ipcRenderer.on('download complete', (_event, filePath) => {
      logger.info('Firmware downloaded successfully');
      setFirmwarePath(filePath);
      setUpdateDownloaded(2);
      if (internetSlowTimeout !== null) {
        clearTimeout(internetSlowTimeout);
        internetSlowTimeout = null;
      }
    });

    ipcRenderer.on('download error', error => {
      logger.error('Error in downloading firmware');
      logger.error(error);
      setDisplayErrorMessage(
        langStrings.ERRORS.DEVICE_UPGRADE_FIRMWARE_DOWNLOAD_FAILED
      );
      setIsCompleted(-1);
      setIsDeviceUpdating(false);
      setUpdateDownloaded(-1);
    });
  };

  const handleRetry = () => {
    logger.info('DeviceUpgrade: Retrying Device Upgrade');
    startDeviceUpdate();
  };

  const cancelDeviceUpgrade = async (
    connection: SerialPort,
    packetVersion: PacketVersion
  ) => {
    if (connection && connection.isOpen)
      deviceUpdater
        .cancel(connection, packetVersion)
        .then(() => logger.info('DeviceUpgrade: Cancelled'))
        .catch(e => {
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
      setIsDeviceUpdating(false);
      deviceUpdater.removeAllListeners();
    });

    deviceUpdater.on('error', err => {
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
      setDisplayErrorMessage(langStrings.ERRORS.DEVICE_UPGRADE_FAILED);
      deviceUpdater.removeAllListeners();
    });

    try {
      setIsInFlow(true);
      /**
       * Error will be thrown in rare conditions where the implementation
       * itself has broken.
       */
      await deviceUpdater.run({
        connection: deviceConnection,
        sdkVersion: deviceSdkVersion,
        packetVersion: devicePacketVersion,
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
    }
  };

  useEffect(() => {
    if (updateDownloaded === 2) {
      logger.info('Running device update');
      if (!beforeFlowStart(true)) {
        setDisplayErrorMessage(langStrings.ERRORS.DEVICE_NOT_CONNECTED);
        setIsCompleted(-1);
        setIsDeviceUpdating(false);
        return;
      }
      setIsDeviceUpdating(true);
      setApproved(1);
      handleDeviceUpgrade();
    }
  }, [updateDownloaded]);

  // Trigger device auth when firmware version has changed,
  // update is completed and there is a device connection
  let timeout: NodeJS.Timeout | undefined;
  const retries = React.useRef<number>(1);
  const MAX_RETRIES = 3;

  const initiateDeviceAuth = async () => {
    try {
      logger.info('In Device update timeout');
      const { connection } = await createPort();

      logger.info('Initiating auth');
      handleDeviceAuth({
        connection,
        sdkVersion: deviceSdkVersion,
        packetVersion: devicePacketVersion,
        setIsInFlow: () => {
          // empty
        },
        firmwareVersion: hexToVersion(latestVersion),
        setDeviceSerial,
        inTestApp: inTestApp(deviceState)
      });
    } catch (error) {
      retries.current += 1;

      if (retries.current > MAX_RETRIES) {
        logger.warn('Error in device auth, max retries exceeded.');
        logger.error(error);
        setDisplayErrorMessage(
          langStrings.ERRORS.DEVICE_UPGRADE_CONNECTION_FAILED_IN_AUTH
        );
        setIsCompleted(-1);
        setIsDeviceUpdating(false);
      } else {
        logger.warn('Error in device auth, retrying...');
        logger.error(error);

        if (timeout) {
          clearTimeout(timeout);
          timeout = undefined;
        }

        timeout = setTimeout(initiateDeviceAuth, 2000);
      }
    }
  };

  useEffect(() => {
    if (isUpdated === 2) {
      logger.info('Device updated successfully, initiating device auth');
      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }

      // Additional delay for device to become active
      timeout = setTimeout(initiateDeviceAuth, 10000);
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
      } else {
        logger.warn('Error in device auth, retrying...');
        logger.warn(errorMessage);

        if (timeout) {
          clearTimeout(timeout);
          timeout = undefined;
        }

        timeout = setTimeout(initiateDeviceAuth, 2000);
      }
    } else if (completed && verified === 2) {
      logger.info('Device auth completed');
      setIsCompleted(2);
      setTimeout(() => setIsDeviceUpdating(false), 500);
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
    devicePacketVersion,
    inBackgroundProcess,
    firmwareVersion,
    deviceState,
    isCompleted,
    setIsCompleted,
    displayErrorMessage,
    setDisplayErrorMessage,
    setIsDeviceUpdating,
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
    setUpdated
  } as UseDeviceUpgradeValues;
};
