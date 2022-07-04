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
  CyError,
  CysyncError,
  DisplayError,
  handleAxiosErrors,
  handleDeviceErrors,
  handleErrors
} from '../../../errors';
import Analytics from '../../../utils/analytics';
import {
  compareVersion,
  getFirmwareHex,
  hexToVersion,
  inTestApp
} from '../../../utils/compareVersion';
import logger from '../../../utils/logger';
import {
  ConnectionContextInterface,
  FeedbackState,
  useConnection,
  useFeedback,
  useI18n
} from '../../provider';

import { useDeviceAuth } from './useDeviceAuth';

const flowName = Analytics.Categories.DEVICE_UPDATE;
export enum DeviceUpgradeErrorResolutionState {
  NO_ERROR,
  NO_RECONNECT_REQUIRED,
  RECONNECT_REQUIRED,
  DEVICE_AUTH_REQUIRED
}

export interface UseDeviceUpgradeValues {
  startDeviceUpdate: () => void;
  handleRetry: () => void;
  deviceConnection: ConnectionContextInterface['deviceConnection'];
  inBackgroundProcess: ConnectionContextInterface['inBackgroundProcess'];
  firmwareVersion: ConnectionContextInterface['firmwareVersion'];
  deviceState: ConnectionContextInterface['deviceState'];
  isCompleted: 0 | 1 | -1 | 2;
  setIsCompleted: React.Dispatch<React.SetStateAction<number>>;
  isDeviceUpdating: boolean;
  setIsDeviceUpdating: ConnectionContextInterface['setIsDeviceUpdating'];
  setBlockNewConnection: ConnectionContextInterface['setBlockNewConnection'];
  updateDownloaded: 0 | 1 | -1 | 2;
  beforeFlowStart: ConnectionContextInterface['beforeFlowStart'];
  isApproved: 0 | 1 | -1 | 2;
  setApproved: React.Dispatch<React.SetStateAction<number>>;
  isInternetSlow: boolean;
  isUpdated: 0 | 1 | -1 | 2;
  isAuthenticated: 0 | 1 | -1 | 2;
  setDeviceSerial: ConnectionContextInterface['setDeviceSerial'];
  verified: number;
  errorObj: DisplayError;
  completed: boolean;
  resetHooks: () => void;
  latestVersion: string;
  updateProgress: number;
  errorResolutionState: DeviceUpgradeErrorResolutionState;
  setLatestVersion: React.Dispatch<React.SetStateAction<string>>;
  setUpdated: React.Dispatch<React.SetStateAction<number>>;
  cancelDeviceUpgrade: (connection: DeviceConnection) => void;
  handleFeedbackOpen: () => void;
  checkLatestFirmware: (onSuccess?: () => void, onError?: () => void) => void;
  upgradeAvailable: boolean;
  setErrorObj: React.Dispatch<React.SetStateAction<DisplayError>>;
  clearErrorObj: () => void;
}

export type UseDeviceUpgrade = (isInitial?: boolean) => UseDeviceUpgradeValues;

export const useDeviceUpgrade: UseDeviceUpgrade = (isInitial?: boolean) => {
  const {
    handleDeviceAuth,
    verified,
    completed,
    resetHooks,
    setErrorObj,
    errorObj
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
  const { showFeedback } = useFeedback();

  const [isCompleted, setIsCompleted] = React.useState<-1 | 0 | 1 | 2>(0);
  // This denotes how the error should be resolved
  const [errorResolutionState, setErrorResolutionState] =
    React.useState<DeviceUpgradeErrorResolutionState>(
      DeviceUpgradeErrorResolutionState.NO_ERROR
    );
  const [isApproved, setApproved] = React.useState<-1 | 0 | 1 | 2>(0);
  const [isUpdated, setUpdated] = React.useState<-1 | 0 | 1 | 2>(0);
  const [isAuthenticated, setAuthenticated] = React.useState<-1 | 0 | 1 | 2>(0);
  const [updateProgress, setUpdateProgress] = React.useState(0);
  const [updateDownloaded, setUpdateDownloaded] = React.useState<
    -1 | 0 | 1 | 2
  >(1);
  const [latestVersion, setLatestVersion] = React.useState('0.0.0');
  const [firmwarePath, setFirmwarePath] = React.useState('');
  const [isInternetSlow, setIsInternetSlow] = React.useState(false);
  const internetSlowTimeout = React.useRef<NodeJS.Timeout | undefined>(
    undefined
  );
  const [upgradeAvailable, setUpgradeAvailable] = React.useState(false);

  const waitForCancel = React.useRef(false);
  const alreadyCancelled = React.useRef(false);

  const checkLatestFirmware = async (
    onSuccess?: () => void,
    onError?: () => void
  ): Promise<string | undefined> => {
    try {
      const response = await firmwareServer.getLatest().request();

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
      if (
        (firmwareVersion &&
          deviceState &&
          compareVersion(
            response.data.firmware.version,
            hexToVersion(firmwareVersion)
          )) ||
        inTestApp(deviceState)
      ) {
        setUpgradeAvailable(true);
      }

      if (process.env.BUILD_TYPE === 'debug' || inBootloader)
        setUpgradeAvailable(true);

      //What is this sorcery???
      if (onSuccess) onSuccess();
      return response.data.firmware.downloadUrl;
    } catch (error) {
      logger.error('Error in getting firmware version');
      logger.error(error);
      const cyError = new CyError();
      handleAxiosErrors(cyError, error, langStrings);
      setErrorObj(handleErrors(errorObj, cyError, flowName, { error }));
      setErrorResolutionState(
        DeviceUpgradeErrorResolutionState.NO_RECONNECT_REQUIRED
      );
      setUpdateDownloaded(-1);
      setIsCompleted(-1);
      setBlockNewConnection(false);
      if (internetSlowTimeout.current) {
        clearTimeout(internetSlowTimeout.current);
        internetSlowTimeout.current = undefined;
      }
      if (onError) onError();
    }
  };

  const startDeviceUpdate = async () => {
    alreadyCancelled.current = false;
    waitForCancel.current = false;

    setApproved(0);
    setIsCompleted(0);
    setUpdated(0);
    setAuthenticated(0);
    setUpdateProgress(0);
    setUpdateDownloaded(0);
    setLatestVersion('0.0.0');
    setFirmwarePath('');
    setIsInternetSlow(false);
    setErrorResolutionState(DeviceUpgradeErrorResolutionState.NO_ERROR);
    setErrorObj(new CyError());
    resetHooks();

    setUpdateDownloaded(1);

    logger.info('Initiating device update from settings');

    if (!beforeFlowStart(true)) {
      const cyError = new CyError(
        DeviceErrorType.NOT_CONNECTED,
        langStrings.ERRORS.DEVICE_NOT_CONNECTED
      );

      setErrorObj(handleErrors(errorObj, cyError, flowName));
      setErrorResolutionState(
        DeviceUpgradeErrorResolutionState.NO_RECONNECT_REQUIRED
      );
      setIsCompleted(-1);
      return;
    }

    setBlockNewConnection(true);
    let downloadUrl;
    try {
      downloadUrl = await checkLatestFirmware();
    } catch (e) {
      setIsDeviceUpdating(false);
      if (internetSlowTimeout.current) {
        clearTimeout(internetSlowTimeout.current);
        internetSlowTimeout.current = undefined;
      }
      return;
    }

    internetSlowTimeout.current = setTimeout(() => {
      logger.verbose('Setting internet Slow.');
      setIsInternetSlow(true);
    }, 5000);

    ipcRenderer.send('download', {
      url: downloadUrl,
      properties: {
        directory: `${process.env.userDataPath}`,
        filename: 'app_dfu_package.bin'
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
      const cyError = new CyError(
        CysyncError.DEVICE_UPGRADE_FIRMWARE_DOWNLOAD_FAILED,
        langStrings.ERRORS.DEVICE_UPGRADE_FIRMWARE_DOWNLOAD_FAILED
      );
      setErrorResolutionState(
        DeviceUpgradeErrorResolutionState.NO_RECONNECT_REQUIRED
      );
      setErrorObj(handleErrors(errorObj, cyError, flowName, { error }));
      setIsCompleted(-1);
      setBlockNewConnection(false);
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
        setBlockNewConnection(false);
        logger.info('DeviceUpgrade: Cancelled');
      })
      .catch(e => {
        setBlockNewConnection(false);
        logger.error('DeviceUpgrade: Error in flow cancel');
        logger.error(e);
      });
  };

  const handleDeviceUpgrade = async () => {
    if (!deviceConnection) {
      const cyError = new CyError(
        DeviceErrorType.NOT_CONNECTED,
        langStrings.ERRORS.DEVICE_NOT_CONNECTED
      );
      setErrorObj(handleErrors(errorObj, cyError, flowName));
      setErrorResolutionState(
        DeviceUpgradeErrorResolutionState.NO_RECONNECT_REQUIRED
      );
      setUpdated(-1);
      setApproved(val => (val === 2 ? val : -1));
      setIsCompleted(-1);
      setBlockNewConnection(false);
      deviceUpdater.removeAllListeners();
      return;
    }

    deviceUpdater.on('completed', () => {
      logger.info('Device Update completed');
      setUpdated(2);
      setAuthenticated(1);
      deviceUpdater.removeAllListeners();
    });

    deviceUpdater.on('progress', (percent: number) => {
      setUpdateProgress(Math.round(percent));
    });

    deviceUpdater.on('updateConfirmed', (val: boolean) => {
      if (val) {
        logger.info('Device update confirmed');
        setApproved(2);
        setUpdated(1);
        setIsCompleted(1);
      } else {
        setApproved(-1);
        const cyError = new CyError(
          CysyncError.DEVICE_UPGRADE_REJECTED,
          langStrings.ERRORS.DEVICE_UPGRADE_REJECTED
        );
        setErrorObj(handleErrors(errorObj, cyError, flowName));
        setErrorResolutionState(
          DeviceUpgradeErrorResolutionState.NO_RECONNECT_REQUIRED
        );
        setUpdated(-1);
        setIsDeviceUpdating(false);
        setIsCompleted(-1);
        setBlockNewConnection(false);
        deviceUpdater.removeAllListeners();
      }
    });

    deviceUpdater.on('notReady', () => {
      const cyError = new CyError();
      logger.info('DeviceUpgrade: Device not ready');
      setErrorResolutionState(
        DeviceUpgradeErrorResolutionState.NO_RECONNECT_REQUIRED
      );

      if (isInitial) {
        cyError.setError(
          CysyncError.DEVICE_NOT_READY_IN_INITIAL,
          langStrings.ERRORS.DEVICE_NOT_READY_IN_INITIAL
        );
      } else {
        cyError.setError(
          CysyncError.DEVICE_NOT_READY,
          langStrings.ERRORS.DEVICE_NOT_READY
        );
      }
      setErrorObj(handleErrors(errorObj, cyError, flowName));

      setUpdated(-1);
      setApproved(-1);
      setIsCompleted(-1);
      setBlockNewConnection(false);
      deviceUpdater.removeAllListeners();
    });

    deviceUpdater.on('error', err => {
      waitForCancel.current = true;
      const cyError = new CyError();
      setErrorResolutionState(
        DeviceUpgradeErrorResolutionState.RECONNECT_REQUIRED
      );
      if (err instanceof DeviceError) {
        handleDeviceErrors(cyError, err, langStrings, flowName);
      } else {
        // unknown flow error
        cyError.setError(
          CysyncError.UNKNOWN_FLOW_ERROR,
          langStrings.ERRORS.UNKNOWN_FLOW_ERROR(flowName)
        );
      }
      setErrorObj(handleErrors(errorObj, cyError, flowName, { err }));
      setUpdated(-1);
      setApproved(val => (val === 2 ? val : -1));
      setIsCompleted(-1);
      deviceUpdater.removeAllListeners();
    });

    deviceUpdater.on('failed', () => {
      setUpdated(-1);
      setApproved(-1);
      setIsCompleted(-1);
      setBlockNewConnection(false);
      const cyError = new CyError(
        CysyncError.DEVICE_UPGRADE_FAILED,
        langStrings.ERRORS.DEVICE_UPGRADE_FAILED
      );
      setErrorObj(handleErrors(errorObj, cyError, flowName));
      setErrorResolutionState(
        DeviceUpgradeErrorResolutionState.RECONNECT_REQUIRED
      );
      deviceUpdater.removeAllListeners();
    });

    try {
      setIsInFlow(true);
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
      const cyError = new CyError(
        CysyncError.UNKNOWN_FLOW_ERROR,
        langStrings.ERRORS.UNKNOWN_FLOW_ERROR(flowName)
      );
      setErrorObj(handleErrors(errorObj, cyError, flowName, { e }));
      setErrorResolutionState(
        DeviceUpgradeErrorResolutionState.RECONNECT_REQUIRED
      );
      deviceUpdater.removeAllListeners();
      setBlockNewConnection(false);
    }

    if (waitForCancel.current && !alreadyCancelled.current) {
      setBlockNewConnection(false);
    }
  };

  useEffect(() => {
    if (updateDownloaded === 2) {
      logger.info('Running device update');
      setIsDeviceUpdating(true);
      if (!beforeFlowStart(true)) {
        const cyError = new CyError(
          DeviceErrorType.NOT_CONNECTED,
          langStrings.ERRORS.DEVICE_NOT_CONNECTED
        );
        setErrorObj(handleErrors(errorObj, cyError, flowName));
        setErrorResolutionState(
          DeviceUpgradeErrorResolutionState.RECONNECT_REQUIRED
        );
        setUpdated(-1);
        setIsCompleted(-1);
        setBlockNewConnection(false);
        return;
      }
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

      logger.info('handleDeviceAuth Params', {
        deviceState: connection.deviceState,
        latestVersion
      });
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
        if (
          !(
            errorObj.isSet &&
            errorObj.getCode() === DeviceErrorType.DEVICE_DISCONNECTED_IN_FLOW
          )
        ) {
          const cyError = new CyError(
            CysyncError.DEVICE_UPGRADE_CONNECTION_FAILED_IN_AUTH,
            langStrings.ERRORS.DEVICE_UPGRADE_CONNECTION_FAILED_IN_AUTH
          );
          setErrorObj(handleErrors(errorObj, cyError, flowName, { error }));
        }
        logger.error(error);
        setErrorResolutionState(
          DeviceUpgradeErrorResolutionState.DEVICE_AUTH_REQUIRED
        );
        setIsCompleted(-1);
        setBlockNewConnection(false);
      } else {
        logger.warn('Error in device auth, retrying...');
        logger.error(error);

        if (timeout.current) {
          clearTimeout(timeout.current);
          timeout.current = undefined;
        }
        if (!errorObj.isSet)
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
    // Dont do anything if the auth process hasnt even started
    // as the below logic is only applicable after auth has started
    if (verified === 0) return;
    else if (verified === -1 || errorObj.isSet) {
      retries.current += 1;

      if (verified === -1 || retries.current > MAX_RETRIES) {
        if (verified === -1) {
          logger.warn('Device auth failed');
        } else {
          logger.warn('Error in device auth, max retries exceeded.');
        }
        setAuthenticated(-1);
        setErrorResolutionState(
          DeviceUpgradeErrorResolutionState.DEVICE_AUTH_REQUIRED
        );
        const cyError = new CyError(
          CysyncError.DEVICE_AUTH_FAILED,
          langStrings.ERRORS.DEVICE_AUTH_FAILED
        );
        setErrorObj(handleErrors(errorObj, cyError, flowName));
        setIsCompleted(-1);
        setBlockNewConnection(false);
      } else {
        logger.warn('Error in device auth, retrying...');
        logger.warn(errorObj);

        if (timeout.current) {
          clearTimeout(timeout.current);
          timeout.current = undefined;
        }

        timeout.current = setTimeout(initiateDeviceAuth, 2000);
      }
    } else if (completed && verified === 2) {
      logger.info('Device auth completed');
      setAuthenticated(2);
      setIsCompleted(2);
      setTimeout(() => {
        setIsDeviceUpdating(false);
        setBlockNewConnection(false);
      }, 500);
      resetHooks();
    }
  }, [verified, errorObj, completed]);

  const newFeedbackState: FeedbackState = {
    attachLogs: true,
    attachDeviceLogs: false,
    categories: ['Report'],
    category: 'Report',
    description: errorObj.getMessage(),
    descriptionError: '',
    email: '',
    emailError: '',
    subject: `Reporting for Error ${errorObj.getCode()} (Upgrading Device)`,
    subjectError: ''
  };

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
    startDeviceUpdate,
    handleRetry,
    handleDeviceAuth,
    cancelDeviceUpgrade,
    deviceConnection,
    inBackgroundProcess,
    firmwareVersion,
    deviceState,
    isCompleted,
    setIsCompleted,
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
    errorObj,
    completed,
    resetHooks,
    latestVersion,
    setLatestVersion,
    setUpdated,
    isDeviceUpdating,
    handleFeedbackOpen,
    checkLatestFirmware,
    upgradeAvailable,
    setErrorObj,
    clearErrorObj,
    updateProgress,
    isAuthenticated,
    errorResolutionState
  } as UseDeviceUpgradeValues;
};
