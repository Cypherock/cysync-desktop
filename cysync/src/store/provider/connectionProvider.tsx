import {
  checkForConnection,
  createPort,
  DeviceConnection,
  DeviceErrorType
} from '@cypherock/communication';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

import { CysyncError } from '../../errors';
import { inTestApp } from '../../utils/compareVersion';
import logger from '../../utils/logger';
import {
  UpdateRequiredType,
  useGetDeviceInfo
} from '../hooks/flows/useGetDeviceInfo';
import { useDebouncedFunction } from '../hooks/useDebounce';

import { useNetwork } from './networkProvider';
import { useSnackbar } from './snackbarProvider';

export interface ConnectionContextInterface {
  connected: boolean | null;
  deviceConnection: DeviceConnection | null;
  firmwareVersion: string | undefined;
  inBootloader: boolean;
  isDeviceUpdating: boolean;
  setIsDeviceUpdating: React.Dispatch<React.SetStateAction<boolean>>;
  blockNewConnection: boolean;
  setBlockNewConnection: React.Dispatch<React.SetStateAction<boolean>>;
  internalDeviceConnection: DeviceConnection | null;
  isReady: boolean;
  deviceConnectionState: DeviceConnectionState;
  openMisconfiguredPrompt: boolean;
  setOpenMisconfiguredPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  openErrorPrompt: boolean;
  setOpenErrorPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  beforeFlowStart: (useInternal?: boolean) => boolean;
  beforeNetworkAction: () => boolean;
  inBackgroundProcess: boolean;
  deviceSerial: string | null;
  supportedCoinList: Array<{ id: number; version: number }>;
  setDeviceSerial: React.Dispatch<React.SetStateAction<string | null>>;
  deviceSdkVersion: string | null;
  setDeviceSdkVersion: React.Dispatch<React.SetStateAction<string | null>>;
  retryConnection: () => void;
  isDeviceNotReadyCheck: boolean;
  deviceState: string | undefined;
  setDeviceConnectionStatus: React.Dispatch<React.SetStateAction<boolean>>;
  isInFlow: boolean;
  setIsInFlow: React.Dispatch<React.SetStateAction<boolean>>;
  openCancelFlowPrompt: boolean;
  setOpenCancelFlowPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  updateRequiredType: UpdateRequiredType;
  isDeviceAvailable: boolean;
  blockConnectionPopup: boolean;
  setBlockConnectionPopup: React.Dispatch<React.SetStateAction<boolean>>;
  inInitial: boolean;
}

export const ConnectionContext: React.Context<ConnectionContextInterface> =
  React.createContext<ConnectionContextInterface>(
    {} as ConnectionContextInterface
  );

export enum DeviceConnectionState {
  NOT_CONNECTED,
  VERIFIED,
  IN_TEST_APP,
  IN_BOOTLOADER,
  PARTIAL_STATE,
  NEW_DEVICE,
  LAST_AUTH_FAILED,
  DEVICE_NOT_READY,
  UPDATE_REQUIRED,
  UNKNOWN_ERROR
}

/**
 * ***************************** WARNING *****************************
 * To be only used via `Context`. Only 1 instance of useConnectionStatus
 * should be active in the whole application.
 */

export const ConnectionProvider: React.FC = ({ children }) => {
  const snackbar = useSnackbar();

  const [isDeviceUpdating, setIsDeviceUpdating] = useState(false);
  const [blockNewConnection, setBlockNewConnection] = useState(false);
  const [blockConnectionPopup, setBlockConnectionPopup] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [inBackgroundProcess, setInBackgroundProcess] = useState(false);
  const [openErrorPrompt, setOpenErrorPrompt] = useState(false);
  const [openCancelFlowPrompt, setOpenCancelFlowPrompt] = useState(false);
  const [openMisconfiguredPrompt, setOpenMisconfiguredPrompt] = useState(false);
  const [deviceSerial, setDeviceSerial] = useState<string | null>(null);
  const [supportedCoinList, setSupportedCoinList] = useState<
    Array<{ id: number; version: number }>
  >([]);
  const [deviceSdkVersion, setDeviceSdkVersion] = useState<string | null>(null);
  const [isInFlow, setIsInFlow] = useState(false);

  const [deviceConnectionState, setDeviceConnectionState] =
    useState<DeviceConnectionState>(DeviceConnectionState.NOT_CONNECTED);
  const [updateRequiredType, setUpdateRequiredType] =
    useState<UpdateRequiredType>(undefined);
  const [deviceConnectionStatus, setDeviceConnectionStatus] = useState(false);
  const deviceConnectionStatusRef = useRef(false);

  // When the device is first connected, the internalDeviceConnection variable is set.
  // After that, some internal flow starts which decides if the device should be connected or not.
  // If this device is allowed then only the deviceConnection variable is set.

  // Conclusion:
  // deviceConnection - Use this by default for every flow. (You don't need to check for inBackgroundProcess while using this)
  // internalDeviceConnection - Only use this while device upgrading or for any flow which does not take into account the device connection status. While using this, there will be some background flows running, so use the inBackgroundProcess to check that.
  const [deviceConnection, setDeviceConnection] =
    useState<DeviceConnection | null>(null);
  const [internalDeviceConnection, setInternalDeviceConnection] =
    useState<DeviceConnection | null>(null);
  const [firmwareVersion, setFirmwareVersion] = useState<string | undefined>(
    undefined
  );
  const [deviceState, setDeviceState] = useState<string | undefined>(undefined);
  const [inBootloader, setInBootloader] = useState(false);
  const [inInitial, setInInitial] = useState(false);
  const [isDeviceNotReady, setIsDeviceNotReady] = useState(false);
  const [isDeviceNotReadyCheck, setIsDeviceNotReadyCheck] = useState(false);

  const {
    handleGetDeviceInfo,
    authenticated,
    resetHooks,
    clearErrorObj,
    completed,
    errorObj,
    isNewDevice,
    isUpdateRequired,
    lastAuthFailed,
    isNotReady
  } = useGetDeviceInfo();
  const { connected, beforeNetworkAction } = useNetwork();
  const getDeviceInfoRetries = useRef(0);
  const GET_DEVICE_INFO_RETRIES = 3;

  const latestDeviceConnection = React.useRef<any>();

  useEffect(() => {
    latestDeviceConnection.current = internalDeviceConnection;
  }, [internalDeviceConnection]);

  useEffect(() => {
    if (deviceState === '01') setInInitial(true);
    else setInInitial(false);
  }, [deviceState]);

  useEffect(() => {
    checkForConnection(newStatus => {
      // Reconnect when the device connection was destroyed
      if (
        newStatus &&
        latestDeviceConnection?.current &&
        latestDeviceConnection?.current?.destroyed
      ) {
        setDeviceConnectionStatus(false);
      } else {
        setDeviceConnectionStatus(newStatus);
      }
    }, 0.2);
  }, []);

  const checkIfIncomplete = () => {
    if (
      internalDeviceConnection &&
      deviceState &&
      !blockNewConnection &&
      deviceConnectionStatusRef.current
    ) {
      setFirmwareVersion(undefined);
      setInBackgroundProcess(true);
      setDeviceSerial(null);
      setDeviceSdkVersion(null);
      if (inBootloader) {
        logger.info('Device in bootloader');
        setDeviceConnectionState(DeviceConnectionState.IN_BOOTLOADER);
        setUpdateRequiredType(undefined);
        setIsDeviceNotReadyCheck(false);
        setInBackgroundProcess(false);
      } else if (inTestApp(deviceState)) {
        logger.info('Device in testApp');
        logger.info('Trigger partial check for device');
        handleGetDeviceInfo({
          connection: internalDeviceConnection,
          setIsInFlow,
          setFirmwareVersion,
          setDeviceSerial,
          setSdkVersion: setDeviceSdkVersion,
          setSupportedCoinList
        });
      } else {
        logger.info('Trigger partial check for device');
        // Todo: Handle race condition where multiple check auth have been called
        handleGetDeviceInfo({
          connection: internalDeviceConnection,
          setIsInFlow,
          setFirmwareVersion,
          setDeviceSerial,
          setSdkVersion: setDeviceSdkVersion,
          setSupportedCoinList
        });
      }
    } else {
      setIsDeviceNotReadyCheck(false);
      setInBackgroundProcess(false);
    }
  };

  const debounceCheckIfIncomplete = useDebouncedFunction(
    checkIfIncomplete,
    2500
  );

  const createNewConnection = (params?: {
    dontShowReconnection?: boolean;
    isGetDeviceInfoRetry?: boolean;
  }) => {
    if (!params?.isGetDeviceInfoRetry) {
      getDeviceInfoRetries.current = 0;
    }

    setIsDeviceNotReady(false);
    createPort()
      .then(
        ({ connection, inBootloader: inB, deviceState: rawDeviceState }) => {
          if (!params?.dontShowReconnection) {
            setDeviceConnectionState(DeviceConnectionState.NOT_CONNECTED);
          }
          setUpdateRequiredType(undefined);
          setInBootloader(inB);
          setDeviceState(rawDeviceState);
          setInternalDeviceConnection(connection);
          logger.info('Connected device info', {
            inB,
            deviceState: rawDeviceState
          });
          return null;
        }
      )
      .catch(e => {
        logger.error('Error in connecting to device', e);
        setDeviceConnectionState(DeviceConnectionState.NOT_CONNECTED);
        setUpdateRequiredType(undefined);
        if (internalDeviceConnection) {
          internalDeviceConnection.destroy();
        }
        setInternalDeviceConnection(null);
        setDeviceConnection(null);
        setDeviceConnectionStatus(false);
      });
  };

  useEffect(() => {
    deviceConnectionStatusRef.current = deviceConnectionStatus;
    if (deviceConnectionStatus && !internalDeviceConnection) {
      createNewConnection();
    } else if (!deviceConnectionStatus) {
      setIsInFlow(false);
      setIsDeviceNotReady(false);
      setUpdateRequiredType(undefined);
      setDeviceConnectionState(DeviceConnectionState.NOT_CONNECTED);
      if (internalDeviceConnection) {
        internalDeviceConnection.destroy();
      }
      setInternalDeviceConnection(null);
      setDeviceConnection(null);
    }
  }, [deviceConnectionStatus]);

  const retryConnection = (dontShowReconnection?: boolean) => {
    setIsDeviceNotReady(false);
    setUpdateRequiredType(undefined);
    if (!dontShowReconnection) {
      setDeviceConnectionState(DeviceConnectionState.NOT_CONNECTED);
    }
    if (internalDeviceConnection && !blockNewConnection) {
      setFirmwareVersion(undefined);
      setDeviceSerial(null);
      setDeviceSdkVersion(null);
      setInBackgroundProcess(true);
      debounceCheckIfIncomplete();
    }
  };

  useEffect(() => {
    retryConnection();
  }, [internalDeviceConnection, inBootloader, blockNewConnection]);

  useEffect(() => {
    logger.info('Block new connection status', { blockNewConnection });
  }, [blockNewConnection]);

  useEffect(() => {
    if (completed && deviceState && inTestApp(deviceState)) {
      if (errorObj.isSet) {
        logger.info('Error in connecting device on initial', {
          isNewDevice,
          lastAuthFailed,
          isNotReady,
          errorObj
        });
        setUpdateRequiredType(undefined);
        if (isNotReady) {
          setDeviceConnectionState(DeviceConnectionState.DEVICE_NOT_READY);
          setIsDeviceNotReady(true);
        } else if (isUpdateRequired) {
          setUpdateRequiredType(isUpdateRequired);
          setDeviceConnectionState(DeviceConnectionState.UPDATE_REQUIRED);
        } else {
          setDeviceConnectionState(DeviceConnectionState.UNKNOWN_ERROR);
        }
        setIsDeviceNotReadyCheck(false);
        setInBackgroundProcess(false);
        clearErrorObj();
        resetHooks();
      } else {
        logger.info('Device connection established in initial application', {
          firmwareVersion,
          deviceSerial,
          supportedCoinList,
          inBootloader,
          deviceState
        });

        clearErrorObj();
        resetHooks();
        setDeviceConnectionState(DeviceConnectionState.IN_TEST_APP);
        setInBackgroundProcess(false);
      }
      return;
    }

    if (completed && (authenticated === -1 || errorObj.isSet)) {
      logger.info('Device unauthenticated', {
        isNewDevice,
        lastAuthFailed,
        isNotReady,
        errorObj,
        isUpdateRequired
      });
      let allowConnection = false;
      let doRetry = false;
      setUpdateRequiredType(undefined);
      // Allow connection in `isNewDevice` & `lastAuthFailed` states if app is in debug mode.
      if (!deviceConnectionStatus) {
        setDeviceConnectionState(DeviceConnectionState.NOT_CONNECTED);
      } else if (isNewDevice) {
        if (process.env.BUILD_TYPE !== 'debug') {
          setDeviceConnectionState(DeviceConnectionState.NEW_DEVICE);
        } else {
          logger.info('Allowing new device in debug build');
          allowConnection = true;
        }
      } else if (lastAuthFailed) {
        if (process.env.BUILD_TYPE !== 'debug') {
          setDeviceConnectionState(DeviceConnectionState.LAST_AUTH_FAILED);
        } else {
          logger.info('Allowing device with lastAuthFailed in debug build');
          allowConnection = true;
        }
      } else if (isNotReady) {
        if (isDeviceNotReadyCheck) {
          setDeviceConnectionState(DeviceConnectionState.DEVICE_NOT_READY);
          setIsDeviceNotReady(true);
        } else if (getDeviceInfoRetries.current > GET_DEVICE_INFO_RETRIES - 1) {
          logger.error(
            'Error in connecting device (not ready), max retries exceeded'
          );
          logger.error(errorObj);
          setDeviceConnectionState(DeviceConnectionState.DEVICE_NOT_READY);
          setIsDeviceNotReady(true);
        } else {
          doRetry = true;
          getDeviceInfoRetries.current = getDeviceInfoRetries.current + 1;
          logger.warn(
            'Error in connecting device (not ready), retrying... ' +
              getDeviceInfoRetries.current
          );
          logger.warn(errorObj);
        }
      } else if (isUpdateRequired) {
        setUpdateRequiredType(isUpdateRequired);
        setDeviceConnectionState(DeviceConnectionState.UPDATE_REQUIRED);
      } else if (errorObj.isSet) {
        if (getDeviceInfoRetries.current > GET_DEVICE_INFO_RETRIES - 1) {
          logger.error('Error in connecting device, max retries exceeded');
          logger.error(errorObj);
          setDeviceConnectionState(DeviceConnectionState.UNKNOWN_ERROR);
        } else {
          doRetry = true;
          getDeviceInfoRetries.current = getDeviceInfoRetries.current + 1;
          logger.warn(
            'Error in connecting device, retrying... ' +
              getDeviceInfoRetries.current
          );
          logger.warn(errorObj);
        }
      } else {
        setDeviceConnectionState(DeviceConnectionState.PARTIAL_STATE);
      }

      if (doRetry) {
        createNewConnection({
          dontShowReconnection: true,
          isGetDeviceInfoRetry: true
        });
        setIsDeviceNotReadyCheck(false);
        clearErrorObj();
        resetHooks();
        return;
      } else {
        getDeviceInfoRetries.current = 0;
      }

      if (!allowConnection) {
        setIsDeviceNotReadyCheck(false);
        setInBackgroundProcess(false);
        clearErrorObj();
        resetHooks();
        return;
      }
    }

    if (completed) {
      logger.info('Authenticated Device connection established', {
        firmwareVersion,
        deviceSerial,
        supportedCoinList,
        inBootloader,
        deviceState
      });
      clearErrorObj();
      resetHooks();
      setDeviceConnection(internalDeviceConnection);
      setDeviceConnectionState(DeviceConnectionState.VERIFIED);
      setUpdateRequiredType(undefined);
      setIsDeviceNotReadyCheck(false);
      setInBackgroundProcess(false);
    }
  }, [completed]);

  useEffect(() => {
    logger.info(`Device Connection Status Code: ${getLogMessage()}`);
    if (deviceConnectionState === DeviceConnectionState.VERIFIED) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }

    if (
      [
        DeviceConnectionState.NOT_CONNECTED,
        DeviceConnectionState.VERIFIED
      ].includes(deviceConnectionState)
    ) {
      setOpenMisconfiguredPrompt(false);
    } else {
      setOpenMisconfiguredPrompt(true);
    }
  }, [deviceConnectionState]);

  const notReadyCheckTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
    notReadyCheckTimeout.current = setTimeout(() => {
      if (isDeviceNotReady) {
        logger.info('Checking if device is ready now.');
        setIsDeviceNotReadyCheck(true);
        setInBackgroundProcess(true);
        setIsDeviceNotReady(false);
        checkIfIncomplete();
      }
    }, 2000);

    return () => {
      if (notReadyCheckTimeout.current) {
        clearTimeout(notReadyCheckTimeout.current);
        notReadyCheckTimeout.current = undefined;
      }
    };
  }, [isDeviceNotReady]);

  const beforeFlowStart = (useInternal?: boolean) => {
    if (inBackgroundProcess) {
      snackbar.showSnackbar('Wait while the device is connecting', 'warning');
      return false;
    }

    if (isInFlow) {
      setOpenCancelFlowPrompt(true);
      return false;
    }

    if (useInternal) {
      if (internalDeviceConnection && !inBackgroundProcess) {
        return true;
      }

      snackbar.showSnackbar('Connect the device and try again', 'warning');
      return false;
    }

    if (isReady) return true;

    if (deviceConnectionState === DeviceConnectionState.NOT_CONNECTED) {
      snackbar.showSnackbar('Connect the device and try again', 'warning');
    } else {
      setOpenMisconfiguredPrompt(true);
    }
    return false;
  };

  const externalSetBlockNewConnection = (val: boolean) => {
    // Refresh connection status when device is done updating
    if (!val) {
      setDeviceConnectionStatus(false);
    }

    setBlockNewConnection(val);
  };

  const getLogMessage = () => {
    switch (deviceConnectionState) {
      case DeviceConnectionState.VERIFIED:
        return 'Device Verified';
      case DeviceConnectionState.NOT_CONNECTED:
        return DeviceErrorType.NOT_CONNECTED;
      case DeviceConnectionState.IN_TEST_APP:
        return CysyncError.DEVICE_HAS_INITIAL_FIRMWARE;
      case DeviceConnectionState.IN_BOOTLOADER:
        return CysyncError.DEVICE_IN_BOOTLOADER;
      case DeviceConnectionState.PARTIAL_STATE:
        return CysyncError.DEVICE_IN_PARTIAL_STATE;
      case DeviceConnectionState.NEW_DEVICE:
        return CysyncError.NEW_DEVICE_CONNECTED;
      case DeviceConnectionState.LAST_AUTH_FAILED:
        return CysyncError.LAST_DEVICE_AUTH_FAILED;
      case DeviceConnectionState.DEVICE_NOT_READY:
        return CysyncError.DEVICE_NOT_READY;
      case DeviceConnectionState.UNKNOWN_ERROR:
        return CysyncError.UNKNOWN_CONNECTION_ERROR;
      case DeviceConnectionState.UPDATE_REQUIRED:
        if (updateRequiredType === 'app') {
          return CysyncError.INCOMPATIBLE_DESKTOP;
        }

        if (updateRequiredType === 'device') {
          return CysyncError.INCOMPATIBLE_DEVICE;
        }

        return CysyncError.INCOMPATIBLE_DEVICE_AND_DESKTOP;
      default:
        return CysyncError.UNKNOWN_CONNECTION_ERROR;
    }
  };

  return (
    <ConnectionContext.Provider
      value={{
        connected,
        deviceConnection,
        firmwareVersion,
        inBootloader,
        isDeviceUpdating,
        setIsDeviceUpdating,
        internalDeviceConnection,
        isReady,
        deviceConnectionState,
        openMisconfiguredPrompt,
        setOpenMisconfiguredPrompt,
        openErrorPrompt,
        setOpenErrorPrompt,
        beforeFlowStart,
        beforeNetworkAction,
        inBackgroundProcess,
        deviceSerial,
        supportedCoinList,
        setDeviceSerial,
        deviceSdkVersion,
        setDeviceSdkVersion,
        retryConnection,
        isDeviceNotReadyCheck,
        deviceState,
        setDeviceConnectionStatus,
        isInFlow,
        setIsInFlow,
        openCancelFlowPrompt,
        setOpenCancelFlowPrompt,
        updateRequiredType,
        blockNewConnection,
        setBlockNewConnection: externalSetBlockNewConnection,
        isDeviceAvailable: deviceConnectionStatus,
        setBlockConnectionPopup,
        blockConnectionPopup,
        inInitial
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

ConnectionProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useConnection(): ConnectionContextInterface {
  return React.useContext(ConnectionContext);
}
