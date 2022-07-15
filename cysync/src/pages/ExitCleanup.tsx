import { CancelFlow } from '@cypherock/protocols';
import { Backdrop, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from 'react';

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

const ExitCleanup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { internalDeviceConnection, deviceSdkVersion } = useConnection();

  const cancelFlow = new CancelFlow();

  const runExitCleanup = async () => {
    logger.info('ExitCleanup Started');

    try {
      await cancelFlow.run({
        connection: internalDeviceConnection,
        sdkVersion: deviceSdkVersion
      });
      passEnDb.destroyHash();
    } catch (error) {
      logger.error('Error in exit cleanup');
      logger.error(error);
    }

    logger.info('ExitCleanup Completed');
    ipcRenderer.send('exit-app');
  };

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
