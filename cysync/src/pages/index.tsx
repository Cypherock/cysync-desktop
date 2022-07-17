import Grid from '@mui/material/Grid';
import React from 'react';

import { useLockscreen, useSnackbar } from '../store/provider';

import ExitCleanup from './ExitCleanup';
import InitialDeviceFlow from './initialApp/deviceFlow';
import InitialFlow from './initialApp/initialFlow';
import InternetStatus from './InternetStatus';
import Dashboard from './mainApp';

const Index = () => {
  const {
    isInitialFlow,
    handleInitialFlowClose,
    handleSkipPassword,
    isDeviceConnected,
    handleDeviceConnected,
    setDoCleanupFunction
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
      <ExitCleanup setDoCleanupFunction={setDoCleanupFunction} />
      <InternetStatus />
      <Grid container style={{ height: '100%' }}>
        {renderComponent()}
      </Grid>
    </>
  );
};

export default Index;
