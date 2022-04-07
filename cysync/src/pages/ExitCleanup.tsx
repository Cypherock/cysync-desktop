import { CancelFlow } from '@cypherock/protocols';
import { Backdrop, CircularProgress } from '@material-ui/core';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { ipcRenderer } from 'electron';
import React, { useEffect, useState } from 'react';

import { Databases, dbUtil } from '../store/database';
import { useConnection } from '../store/provider';
import logger from '../utils/logger';

const useStyles = makeStyles((theme: Theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1
  }
}));

const ExitCleanup = () => {
  const classes = useStyles();
  const [isOpen, setIsOpen] = useState(false);
  const { internalDeviceConnection, devicePacketVersion, deviceSdkVersion } =
    useConnection();

  const cancelFlow = new CancelFlow();

  const runExitCleanup = async () => {
    logger.info('ExitCleanup Started');
    if (internalDeviceConnection) {
      try {
        await cancelFlow.run({
          connection: internalDeviceConnection,
          packetVersion: devicePacketVersion,
          sdkVersion: deviceSdkVersion
        });
        dbUtil(Databases.PASSEN, 'destroyHash');
      } catch (error) {
        logger.error('Error in exit cleanup');
        logger.error(error);
      }
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
    <Backdrop className={classes.backdrop} open={isOpen}>
      <CircularProgress color="secondary" />
    </Backdrop>
  );
};

export default ExitCleanup;
