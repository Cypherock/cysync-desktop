import {
  checkForConnection,
  createPort,
  PacketVersion
} from '@cypherock/communication';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import SerialPort from 'serialport';

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
  deviceConnection: SerialPort | null;
  firmwareVersion: string | undefined;
  inBootloader: boolean;
  isDeviceUpdating: boolean;
  setIsDeviceUpdating: React.Dispatch<React.SetStateAction<boolean>>;
  internalDeviceConnection: SerialPort | null;
  isReady: boolean;
  verifyState: number;
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
  devicePacketVersion: PacketVersion | null;
  setDevicePacketVersion: React.Dispatch<
    React.SetStateAction<PacketVersion | null>
  >;
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
  const [devicePacketVersion, setDevicePacketVersion] =
    useState<PacketVersion | null>(null);
  const [isInFlow, setIsInFlow] = useState(false);

  // Verify States:
  // -1: Device not connected
  // 0: Verified
  // 1: In Test app
  // 2: In Bootloader
  // 3: In partial update state
  // 4: Is new device
  // 5: Last auth failed
  // 6: Device not ready
  // 7: Unknown error
  // 8: Update Required
  const [verifyState, setVerifyState] = useState(-1);
  const [updateRequiredType, setUpdateRequiredType] =
    useState<UpdateRequiredType>(undefined);
  const [deviceConnectionStatus, setDeviceConnectionStatus] = useState(false);

  // When the device is first connected, the internalDeviceConnection variable is set.
  // After that, some internal flow starts which decides if the device should be connected or not.
  // If this device is allowed then only the deviceConnection variable is set.

  // Conclusion:
  // deviceConnection - Use this by default for every flow. (You don't need to check for inBackgroundProcess while using this)
  // internalDeviceConnection - Only use this while device upgrading or for any flow which does not take into account the device connection status. While using this, there will be some background flows running, so use the inBackgroundProcess to check that.
  const [deviceConnection, setDeviceConnection] = useState<SerialPort | null>(
    null
  );
  const [internalDeviceConnection, setInternalDeviceConnection] =
    useState<SerialPort | null>(null);
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

  useEffect(() => {
    checkForConnection(setDeviceConnectionStatus, 2);
  }, []);

  const checkIfIncomplete = () => {
    if (internalDeviceConnection && deviceState && !isDeviceUpdating) {
      setFirmwareVersion(undefined);
      setInBackgroundProcess(true);
      setDeviceSerial(null);
      setDeviceSdkVersion(null);
      setDevicePacketVersion(null);
      if (inBootloader) {
        logger.info('Device in bootloader');
        setVerifyState(2);
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
          setPacketVersion: setDevicePacketVersion
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
          setPacketVersion: setDevicePacketVersion
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
            setVerifyState(-1);
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
          setVerifyState(-1);
          setUpdateRequiredType(undefined);
          setInternalDeviceConnection(null);
          setDeviceConnection(null);
          setDeviceConnectionStatus(false);
        });
    } else if (!deviceConnectionStatus) {
      setIsInFlow(false);
      setIsDeviceNotReady(false);
      setUpdateRequiredType(undefined);
      setVerifyState(-1);
      setInternalDeviceConnection(null);
      setDeviceConnection(null);
    }
  }, [deviceConnectionStatus]);

  const retryConnection = () => {
    setIsDeviceNotReady(false);
    setUpdateRequiredType(undefined);
    setVerifyState(-1);
    if (internalDeviceConnection && !isDeviceUpdating) {
      setFirmwareVersion(undefined);
      setDeviceSerial(null);
      setDeviceSdkVersion(null);
      setDevicePacketVersion(null);
      setInBackgroundProcess(true);
      debounceCheckIfIncomplete();
    } else {
      setInBackgroundProcess(false);
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
          setVerifyState(6);
          setIsDeviceNotReady(true);
        } else if (isUpdateRequired) {
          setUpdateRequiredType(isUpdateRequired);
          setVerifyState(8);
        } else {
          setVerifyState(7);
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
        setVerifyState(1);
        setInBackgroundProcess(false);
      }
      return;
    }

    if (completed && (authenticated === -1 || errorMessage)) {
      logger.info('Device unauthenticated', {
        isNewDevice,
        lastAuthFailed,
        isNotReady,
        errorMessage
      });
      let allowConnection = false;
      setUpdateRequiredType(undefined);
      // Allow connection in `isNewDevice` & `lastAuthFailed` states if app is in debug mode.
      if (isNewDevice) {
        if (process.env.BUILD_TYPE !== 'debug') {
          setVerifyState(4);
        } else {
          logger.info('Allowing new device in debug build');
          allowConnection = true;
        }
      } else if (lastAuthFailed) {
        if (process.env.BUILD_TYPE !== 'debug') {
          setVerifyState(5);
        } else {
          logger.info('Allowing device with lastAuthFailed in debug build');
          allowConnection = true;
        }
      } else if (isNotReady) {
        setVerifyState(6);
        setIsDeviceNotReady(true);
      } else if (isUpdateRequired) {
        setUpdateRequiredType(isUpdateRequired);
        setVerifyState(8);
      } else if (errorMessage) {
        setVerifyState(7);
      } else {
        setVerifyState(3);
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
      setVerifyState(0);
      setUpdateRequiredType(undefined);
      setIsDeviceNotReadyCheck(false);
      setInBackgroundProcess(false);
    }
  }, [authenticated, completed, errorMessage]);

  useEffect(() => {
    if (verifyState === 0) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }

    if ([-1, 0].includes(verifyState)) {
      setOpenVerifyPrompt(false);
    } else {
      setOpenVerifyPrompt(true);
    }
  }, [verifyState]);

  let notReadyCheckTimeout: NodeJS.Timeout | undefined;
  useEffect(() => {
    notReadyCheckTimeout = setTimeout(() => {
      if (isDeviceNotReady) {
        logger.info('Checking if device is ready now.');
        setIsDeviceNotReadyCheck(true);
        setInBackgroundProcess(true);
        setIsDeviceNotReady(false);
        checkIfIncomplete();
      }
    }, 2000);

    return () => {
      if (notReadyCheckTimeout) {
        clearTimeout(notReadyCheckTimeout);
        notReadyCheckTimeout = undefined;
      }
    };
  }, [isDeviceNotReady]);

  const beforeFlowStart = (useInternal?: boolean) => {
    if (isInFlow) {
      setOpenCancelFlowPrompt(true);
      return false;
    }

    if (useInternal) {
      if (internalDeviceConnection && !inBackgroundProcess) {
        return true;
      }

      setOpenErrorPrompt(true);
      return false;
    }

    if (inBackgroundProcess) {
      snackbar.showSnackbar(
        'Please wait while the device is connecting',
        'warning'
      );
      return false;
    }

    if (isReady) return true;

    if (verifyState === -1) {
      setOpenErrorPrompt(true);
    } else {
      setOpenVerifyPrompt(true);
    }
    return false;
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
        devicePacketVersion,
        setDevicePacketVersion,
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
