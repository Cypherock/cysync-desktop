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
  downloadUpdate: () => void;
  installUpdate: () => void;
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
  const [isPersistentAppOpen, setIsPersistentAppOpen] = useState(false);
  const [appUpdateVersion, setAppUpdateVersion] = useState<string>('');

  const [isDeviceUpdateAvailable, setIsDeviceUpdateAvailable] = useState(false);
  const [deviceVersion, setDeviceVersion] = useState('');

  const { connected } = useNetwork();

  const downloadUpdate = () => {
    ipcRenderer.send('start-update');
  };

  const installUpdate = () => {
    ipcRenderer.send('install-update');
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

  const onUpdateDownloadProgress = (_event: any, _info: any) => {
    setAppState(2);
    setIsPersistentAppOpen(true);
  };

  const onUpdateDownloaded = (_event: any, _info: any) => {
    setAppState(3);
    setIsPersistentAppOpen(true);
  };

  useEffect(() => {
    ipcRenderer.on('update-unavailable', onUpdateUnavailable);
    ipcRenderer.on('update-available', onUpdateAvailable);
    ipcRenderer.on('update-download-progress', onUpdateDownloadProgress);
    ipcRenderer.on('update-downloaded', onUpdateDownloaded);

    return () => {
      ipcRenderer.removeListener('update-unavailable', onUpdateUnavailable);
      ipcRenderer.removeListener('update-available', onUpdateAvailable);
      ipcRenderer.removeListener(
        'update-download-progress',
        onUpdateDownloadProgress
      );
      ipcRenderer.removeListener('update-downloaded', onUpdateDownloaded);
    };
  }, []);

  const checkDeviceUpdate = async () => {
    try {
      const usePrerelease = process.env.ALLOW_PRERELEASE === 'true';

      const response = await firmwareServer
        .getLatest({ prerelease: usePrerelease })
        .request();

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
    if (connected) {
      logger.info('Sending update event: ' + new Date().getTime());
      ipcRenderer.send('check-for-update');

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
        deviceVersion,
        downloadUpdate,
        installUpdate
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
