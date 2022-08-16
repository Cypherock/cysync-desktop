import { DeviceConnection } from '@cypherock/communication';
import { CancelFlow } from '@cypherock/protocols';
import { Backdrop, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ipcRenderer } from 'electron';
import React, { useEffect, useRef, useState } from 'react';

import { passEnDb } from '../store/database';
import { useConnection } from '../store/provider';
import logger from '../utils/logger';

const PREFIX = 'ExitCleanup';

const classes = {
  backdrop: `${PREFIX}-backdrop`
};

const StyledBackdrop = styled(Backdrop)(({ theme }) => ({
  [`&.${classes.backdrop}`]: {
    zIndex: theme.zIndex.drawer + 1
  }
}));

export interface ExitCleanupProps {
  setDoCleanupFunction?: (func: () => Promise<void>) => void;
}

const ExitCleanup: React.FC<ExitCleanupProps> = ({ setDoCleanupFunction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { internalDeviceConnection, deviceSdkVersion } = useConnection();

  const latestDeviceConnection = useRef<DeviceConnection | undefined>(
    undefined
  );

  useEffect(() => {
    latestDeviceConnection.current = internalDeviceConnection;
  }, [internalDeviceConnection]);

  const cancelFlow = new CancelFlow();

  const exitCleanup = async () => {
    try {
      const response = await cancelFlow.run({
        connection: latestDeviceConnection.current,
        sdkVersion: deviceSdkVersion
      });
      logger.info('Exit cleanup cancel response', { response });
      passEnDb.destroyHash();
    } catch (error) {
      logger.error('Error in exit cleanup');
      logger.error(error);
    }
  };

  const runExitCleanup = async () => {
    logger.info('ExitCleanup Started');

    await exitCleanup();

    logger.info('ExitCleanup Completed');
    ipcRenderer.send('exit-app');
  };

  const onLockscreen = async () => {
    logger.info('Exit cleanup triggred from lockscreen');
    await exitCleanup();
  };

  useEffect(() => {
    if (setDoCleanupFunction) {
      setDoCleanupFunction(onLockscreen);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      runExitCleanup();
    }
  }, [isOpen]);

  const onExit = () => {
    setIsOpen(true);
  };

  useEffect(() => {
    ipcRenderer.on('on-exit', onExit);

    return () => {
      ipcRenderer.removeListener('on-exit', onExit);
    };
  }, []);

  return (
    <StyledBackdrop className={classes.backdrop} open={isOpen}>
      <CircularProgress color="secondary" />
    </StyledBackdrop>
  );
};

export default ExitCleanup;
