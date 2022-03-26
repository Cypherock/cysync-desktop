import { Backdrop, CircularProgress } from '@material-ui/core';
import { makeStyles, Theme } from '@material-ui/core/styles';
import React from 'react';

import { useLockscreen } from '../store/provider';
import GlobalProvider from '../store/provider/global';

import DeviceStatePrompt from './deviceStatePrompt';
import Internals from './index';
import LockScreen from './lockscreen';

const useStyles = makeStyles((theme: Theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1
  }
}));

const Root = () => {
  const classes = useStyles();
  const {
    lockscreen,
    isLockscreenLoading,
    handleLockScreenClose,
    handleInitialFlowOpen
  } = useLockscreen();

  if (isLockscreenLoading) {
    return (
      <Backdrop className={classes.backdrop} open={isLockscreenLoading}>
        <CircularProgress color="secondary" />
      </Backdrop>
    );
  }

  if (lockscreen) {
    return (
      <LockScreen
        open={lockscreen}
        handleClose={handleLockScreenClose}
        handleReset={handleInitialFlowOpen}
      />
    );
  }

  return (
    <GlobalProvider>
      <DeviceStatePrompt />
      <Internals />
    </GlobalProvider>
  );
};

export default Root;
