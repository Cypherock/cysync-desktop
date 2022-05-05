import {
  checkForConnection,
  createPort,
  DeviceConnection
} from '@cypherock/communication';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

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
  internalDeviceConnection: DeviceConnection | null;
  isReady: boolean;
  verifyState: VerifyState;
  openVerifyPrompt: boolean;
  setOpenVerifyPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  openErrorPrompt: boolean;
  setOpenErrorPrompt: React.Dispatch<React.SetStateAction<boolean>>;
  beforeFlowStart: (useInternal?: boolean) => boolean;
  beforeNetworkAction: () => boolean;
  inBackgroundProcess: boolean;
  deviceSerial: string | null;
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
}

export const ConnectionContext: React.Context<ConnectionContextInterface> =
  React.createContext<ConnectionContextInterface>(
    {} as ConnectionContextInterface
  );

export enum VerifyState {
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
  const [isReady, setIsReady] = useState(false);
  const [inBackgroundProcess, setInBackgroundProcess] = useState(false);
  const [openErrorPrompt, setOpenErrorPrompt] = useState(false);
  const [openCancelFlowPrompt, setOpenCancelFlowPrompt] = useState(false);
  const [openVerifyPrompt, setOpenVerifyPrompt] = useState(false);
  const [deviceSerial, setDeviceSerial] = useState<string | null>(null);
  const [deviceSdkVersion, setDeviceSdkVersion] = useState<string | null>(null);
  const [isInFlow, setIsInFlow] = useState(false);

  const [verifyState, setVerifyState] = useState<VerifyState>(
    VerifyState.NOT_CONNECTED
  );
  const [updateRequiredType, setUpdateRequiredType] =
    useState<UpdateRequiredType>(undefined);
  const [deviceConnectionStatus, setDeviceConnectionStatus] = useState(false);

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
  const [isDeviceNotReady, setIsDeviceNotReady] = useState(false);
  const [isDeviceNotReadyCheck, setIsDeviceNotReadyCheck] = useState(false);

  const {
    handleGetDeviceInfo,
    authenticated,
    resetHooks,
    setErrorMessage,
    completed,
    errorMessage,
    isNewDevice,
    isUpdateRequired,
    lastAuthFailed,
    isNotReady
  } = useGetDeviceInfo();
  const { connected, beforeNetworkAction } = useNetwork();

  const latestDeviceConnection = React.useRef<any>();

  useEffect(() => {
    latestDeviceConnection.current = internalDeviceConnection;
  }, [internalDeviceConnection]);

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
    }, 2);
  }, []);

  const checkIfIncomplete = () => {
    if (internalDeviceConnection && deviceState && !isDeviceUpdating) {
      setFirmwareVersion(undefined);
      setInBackgroundProcess(true);
      setDeviceSerial(null);
      setDeviceSdkVersion(null);
      if (inBootloader) {
        logger.info('Device in bootloader');
        setVerifyState(VerifyState.IN_BOOTLOADER);
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
          setSdkVersion: setDeviceSdkVersion
        });
      } else {
        logger.info('Trigger partial check for device');
        // Todo: Handle race condition where multiple check auth have been called
        handleGetDeviceInfo({
          connection: internalDeviceConnection,
          setIsInFlow,
          setFirmwareVersion,
          setDeviceSerial,
          setSdkVersion: setDeviceSdkVersion
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

  useEffect(() => {
    if (deviceConnectionStatus && !internalDeviceConnection) {
      setIsDeviceNotReady(false);
      createPort()
        .then(
          ({ connection, inBootloader: inB, deviceState: rawDeviceState }) => {
            setVerifyState(VerifyState.NOT_CONNECTED);
            setUpdateRequiredType(undefined);
            setInBootloader(inB);
            setDeviceState(rawDeviceState);
            setInBackgroundProcess(true);
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
          setVerifyState(VerifyState.NOT_CONNECTED);
          setUpdateRequiredType(undefined);
          if (internalDeviceConnection) {
            internalDeviceConnection.destroy();
          }
          setInternalDeviceConnection(null);
          setDeviceConnection(null);
          setDeviceConnectionStatus(false);
        });
    } else if (!deviceConnectionStatus) {
      setIsInFlow(false);
      setIsDeviceNotReady(false);
      setUpdateRequiredType(undefined);
      setVerifyState(VerifyState.NOT_CONNECTED);
      if (internalDeviceConnection) {
        internalDeviceConnection.destroy();
      }
      setInternalDeviceConnection(null);
      setDeviceConnection(null);
    }
  }, [deviceConnectionStatus]);

  const retryConnection = () => {
    setIsDeviceNotReady(false);
    setUpdateRequiredType(undefined);
    setVerifyState(VerifyState.NOT_CONNECTED);
    if (internalDeviceConnection && !isDeviceUpdating) {
      setFirmwareVersion(undefined);
      setDeviceSerial(null);
      setDeviceSdkVersion(null);
      setInBackgroundProcess(true);
      debounceCheckIfIncomplete();
    }
  };

  useEffect(() => {
    retryConnection();
  }, [internalDeviceConnection, inBootloader, isDeviceUpdating]);

  useEffect(() => {
    if (completed && deviceState && inTestApp(deviceState)) {
      if (errorMessage) {
        logger.info('Error in connecting device on initial', {
          isNewDevice,
          lastAuthFailed,
          isNotReady,
          errorMessage
        });
        setUpdateRequiredType(undefined);
        if (isNotReady) {
          setVerifyState(VerifyState.DEVICE_NOT_READY);
          setIsDeviceNotReady(true);
        } else if (isUpdateRequired) {
          setUpdateRequiredType(isUpdateRequired);
          setVerifyState(VerifyState.UPDATE_REQUIRED);
        } else {
          setVerifyState(VerifyState.UNKNOWN_ERROR);
        }
        setIsDeviceNotReadyCheck(false);
        setInBackgroundProcess(false);
        setErrorMessage('');
        resetHooks();
      } else {
        logger.info('Device connection established in initial application', {
          firmwareVersion,
          deviceSerial,
          inBootloader,
          deviceState
        });

        setErrorMessage('');
        resetHooks();
        setVerifyState(VerifyState.IN_TEST_APP);
        setInBackgroundProcess(false);
      }
      return;
    }

    if (completed && (authenticated === -1 || errorMessage)) {
      logger.info('Device unauthenticated', {
        isNewDevice,
        lastAuthFailed,
        isNotReady,
        errorMessage,
        isUpdateRequired
      });
      let allowConnection = false;
      setUpdateRequiredType(undefined);
      // Allow connection in `isNewDevice` & `lastAuthFailed` states if app is in debug mode.
      if (!deviceConnectionStatus) {
        setVerifyState(VerifyState.NOT_CONNECTED);
      } else if (isNewDevice) {
        if (process.env.BUILD_TYPE !== 'debug') {
          setVerifyState(VerifyState.NEW_DEVICE);
        } else {
          logger.info('Allowing new device in debug build');
          allowConnection = true;
        }
      } else if (lastAuthFailed) {
        if (process.env.BUILD_TYPE !== 'debug') {
          setVerifyState(VerifyState.LAST_AUTH_FAILED);
        } else {
          logger.info('Allowing device with lastAuthFailed in debug build');
          allowConnection = true;
        }
      } else if (isNotReady) {
        setVerifyState(VerifyState.DEVICE_NOT_READY);
        setIsDeviceNotReady(true);
      } else if (isUpdateRequired) {
        setUpdateRequiredType(isUpdateRequired);
        setVerifyState(VerifyState.UPDATE_REQUIRED);
      } else if (errorMessage) {
        setVerifyState(VerifyState.UNKNOWN_ERROR);
      } else {
        setVerifyState(VerifyState.PARTIAL_STATE);
      }

      if (!allowConnection) {
        setIsDeviceNotReadyCheck(false);
        setInBackgroundProcess(false);
        setErrorMessage('');
        resetHooks();
        return;
      }
    }

    if (completed) {
      logger.info('Authenticated Device connection established', {
        firmwareVersion,
        deviceSerial,
        inBootloader,
        deviceState
      });
      setErrorMessage('');
      resetHooks();
      setDeviceConnection(internalDeviceConnection);
      setVerifyState(VerifyState.VERIFIED);
      setUpdateRequiredType(undefined);
      setIsDeviceNotReadyCheck(false);
      setInBackgroundProcess(false);
    }
  }, [completed]);

  useEffect(() => {
    if (verifyState === VerifyState.VERIFIED) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }

    if (
      [VerifyState.NOT_CONNECTED, VerifyState.VERIFIED].includes(verifyState)
    ) {
      setOpenVerifyPrompt(false);
    } else {
      setOpenVerifyPrompt(true);
    }
  }, [verifyState]);

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
      snackbar.showSnackbar(
        'Please wait while the device is connecting',
        'warning'
      );
      return false;
    }

    if (useInternal) {
      if (internalDeviceConnection && !inBackgroundProcess) {
        return true;
      }

      setOpenErrorPrompt(true);
      return false;
    }

    if (isInFlow) {
      setOpenCancelFlowPrompt(true);
      return false;
    }

    if (isReady) return true;

    if (verifyState === VerifyState.NOT_CONNECTED) {
      setOpenErrorPrompt(true);
    } else {
      setOpenVerifyPrompt(true);
    }
    return false;
  };

  const externalSetIsDeviceUpdating = (val: boolean) => {
    // Refresh connection status when device is done updating
    if (!val) {
      setDeviceConnectionStatus(false);
    }

    setIsDeviceUpdating(val);
  };

  return (
    <ConnectionContext.Provider
      value={{
        connected,
        deviceConnection,
        firmwareVersion,
        inBootloader,
        isDeviceUpdating,
        setIsDeviceUpdating: externalSetIsDeviceUpdating,
        internalDeviceConnection,
        isReady,
        verifyState,
        openVerifyPrompt,
        setOpenVerifyPrompt,
        openErrorPrompt,
        setOpenErrorPrompt,
        beforeFlowStart,
        beforeNetworkAction,
        inBackgroundProcess,
        deviceSerial,
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
        updateRequiredType
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
