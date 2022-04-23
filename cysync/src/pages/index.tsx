import Grid from '@mui/material/Grid';
import React from 'react';
import IdleTimer from 'react-idle-timer';

import { useLockscreen, useSnackbar } from '../store/provider';

import ExitCleanup from './ExitCleanup';
import InitialDeviceFlow from './initialApp/deviceFlow';
import InitialFlow from './initialApp/initialFlow';
import InternetStatus from './InternetStatus';
import Dashboard from './mainApp';

const Index = () => {
  const {
    isInitialFlow,
    handleLockScreenClickOpen,
    handleInitialFlowClose,
    handleSkipPassword,
    autolockTime,
    showIdleTimer,
    isDeviceConnected,
    handleDeviceConnected
  } = useLockscreen();

  const snackbar = useSnackbar();

  const handleSnackbarOpen = () => {
    snackbar.showSnackbar('Password Set Successfully !', 'success', undefined, {
      dontCloseOnClickAway: true,
      autoHideDuration: 4000
    });
  };

  const renderComponent = () => {
    if (isInitialFlow) {
      return (
        <InitialFlow
          open={isInitialFlow}
          handleClose={handleInitialFlowClose}
          handleSnackbarOpen={handleSnackbarOpen}
          handleSkipPassword={handleSkipPassword}
        />
      );
    }

    if (!isDeviceConnected) {
      return (
        <InitialDeviceFlow handleDeviceConnected={handleDeviceConnected} />
      );
    }

    return <Dashboard />;
  };

  return (
    <>
      <ExitCleanup />
      <InternetStatus />
      {showIdleTimer && (
        <IdleTimer
          element={document}
          onIdle={handleLockScreenClickOpen}
          debounce={250}
          timeout={autolockTime}
        />
      )}
      <Grid container style={{ height: '100%' }}>
        <div>{showIdleTimer}</div>
        {renderComponent()}
      </Grid>
    </>
  );
};

export default Index;
