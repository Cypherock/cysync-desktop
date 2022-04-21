import { Backdrop, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import React from 'react';

import { useLockscreen } from '../store/provider';
import GlobalProvider from '../store/provider/global';

import DeviceStatePrompt from './deviceStatePrompt';
import Internals from './index';
import LockScreen from './lockscreen';

const PREFIX = 'Root';

const classes = {
  backdrop: `${PREFIX}-backdrop`
};

const StyledBackdrop = styled(Backdrop)(({ theme }) => ({
  [`&.${classes.backdrop}`]: {
    zIndex: theme.zIndex.drawer + 1
  }
}));

const Root = () => {
  const {
    lockscreen,
    isLockscreenLoading,
    handleLockScreenClose,
    handleInitialFlowOpen
  } = useLockscreen();

  if (isLockscreenLoading) {
    return (
      <StyledBackdrop className={classes.backdrop} open={isLockscreenLoading}>
        <CircularProgress color="secondary" />
      </StyledBackdrop>
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
