import { stmFirmware as firmwareServer } from '@cypherock/server-wrapper';
import { ipcRenderer } from 'electron';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import logger from '../../utils/logger';

import { useNetwork } from './networkProvider';

export interface UpdateContextInterface {
  appState: number;
  isAppOpen: boolean;
  setIsAppOpen: (val: boolean) => void;
  isPersistentAppOpen: boolean;
  setIsPersistentAppOpen: (val: boolean) => void;
  appUpdateVersion: string;
  isDeviceUpdateAvailable: boolean;
  deviceVersion: string;
}

export const UpdateContext: React.Context<UpdateContextInterface> =
  React.createContext<UpdateContextInterface>({} as UpdateContextInterface);

export const UpdateProvider = ({ children }: any) => {
  /*
    State meaning
    0: Checking for update
    1: Update available, want to download?
    2: Downloading update
    3: Update downloaded, want to install?
    4: Update not available
   */
  const [appState, setAppState] = useState(0);
  const [_isAppUpdateAvailable, setIsAppUpdateAvailable] = useState(false);
  const [isAppOpen, setIsAppOpen] = useState(true);
  const [appUpdateInitiated, setAppUpdateInitiated] = useState(false);
  const [isPersistentAppOpen, setIsPersistentAppOpen] = useState(false);
  const [appUpdateVersion, setAppUpdateVersion] = useState<string>('');

  const [isDeviceUpdateAvailable, setIsDeviceUpdateAvailable] = useState(false);
  const [deviceVersion, setDeviceVersion] = useState('');

  const { connected } = useNetwork();

  // Allow app update only on linux
  const allowAppUpdate = () => {
    return process.platform === 'linux';
  };

  const onUpdateUnavailable = () => {
    setIsAppUpdateAvailable(false);
    setAppState(4);
    setIsAppOpen(false);
    setIsPersistentAppOpen(false);
  };

  const onUpdateAvailable = (_event: any, info: any) => {
    setIsAppUpdateAvailable(true);
    setAppUpdateVersion(info.version);
    logger.info('App update version', { updateAvailable: info.version });
    setAppState(1);
    setIsPersistentAppOpen(true);
  };

  useEffect(() => {
    ipcRenderer.on('update-unavailable', onUpdateUnavailable);
    ipcRenderer.on('update-available', onUpdateAvailable);

    return () => {
      ipcRenderer.removeListener('update-unavailable', onUpdateUnavailable);
      ipcRenderer.removeListener('update-available', onUpdateAvailable);
    };
  }, []);

  const checkDeviceUpdate = async () => {
    try {
      const response = await firmwareServer.getLatest();
      if (response.data.firmware) {
        setDeviceVersion(response.data.firmware.version);
        setIsDeviceUpdateAvailable(true);
      } else {
        throw new Error('Server returned empty Latest firmware.');
      }
    } catch (error) {
      logger.error(error);
    }
  };

  useEffect(() => {
    if (connected && !appUpdateInitiated) {
      if (allowAppUpdate()) {
        setAppUpdateInitiated(true);
        logger.info('Checking for app update');
        ipcRenderer.send('check-for-update');
      }

      logger.info('Checking for device update');
      checkDeviceUpdate();
    }
  }, [connected]);

  return (
    <UpdateContext.Provider
      value={{
        appState,
        isAppOpen,
        setIsAppOpen,
        isPersistentAppOpen,
        setIsPersistentAppOpen,
        appUpdateVersion,
        isDeviceUpdateAvailable,
        deviceVersion
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
};

UpdateProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useUpdater(): UpdateContextInterface {
  return React.useContext(UpdateContext);
}
