import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import { DisplayError } from '../../../../../../../errors';
import { HandleDeviceAuthOptions } from '../../../../../../../store/hooks/flows';
import { useConnection } from '../../../../../../../store/provider';
import Analytics from '../../../../../../../utils/analytics';
import {
  hexToVersion,
  inTestApp
} from '../../../../../../../utils/compareVersion';
import logger from '../../../../../../../utils/logger';
import DynamicTextView from '../dynamicTextView';

interface Props {
  isCompleted: -1 | 0 | 1 | 2;
  setCompleted: React.Dispatch<React.SetStateAction<0 | 1 | -1 | 2>>;
  errorObj: DisplayError;
  handleDeviceAuth: (options: HandleDeviceAuthOptions) => void;
  resetHooks: () => void;
  completed: boolean;
  confirmed: -1 | 0 | 1 | 2;
  verified: -1 | 0 | 1 | 2;
  cancelDeviceAuth: (connection: any) => void;
}

const Authentication: React.FC<Props> = ({
  isCompleted,
  setCompleted,
  errorObj,
  handleDeviceAuth,
  resetHooks,
  completed,
  confirmed,
  verified,
  cancelDeviceAuth
}) => {
  const {
    internalDeviceConnection: deviceConnection,
    deviceSdkVersion,
    firmwareVersion,
    deviceState,
    setDeviceSerial,
    setIsInFlow
  } = useConnection();

  useEffect(() => {
    logger.info('Initiating device authentication from settings');
    if (deviceConnection && firmwareVersion) {
      handleDeviceAuth({
        connection: deviceConnection,
        sdkVersion: deviceSdkVersion,
        setIsInFlow,
        firmwareVersion: hexToVersion(firmwareVersion),
        setDeviceSerial,
        inTestApp: inTestApp(deviceState)
      });
    }
    return () => {
      logger.info('Closed device authentication');
      if (!completed) {
        cancelDeviceAuth(deviceConnection);
      }
    };
  }, []);

  useEffect(() => {
    if (verified === -1 || errorObj.isSet) {
      logger.info('Device auth failed');
      setCompleted(-1);
    } else if (completed && verified === 2) {
      logger.info('Device auth completed');
      setCompleted(2);
      resetHooks();
    }
  }, [verified, completed]);

  useEffect(() => {
    if (isCompleted === -1 || errorObj.isSet) {
      Analytics.Instance.event(
        Analytics.EVENTS.SETTINGS.DEVICE_SETTINGS.DEVICE_UPGRADE.ERROR
      );
    } else if (isCompleted === 2) {
      Analytics.Instance.event(
        Analytics.EVENTS.SETTINGS.DEVICE_SETTINGS.DEVICE_UPGRADE.SUCCESS
      );
    }
  }, [isCompleted, errorObj.isSet]);

  return (
    <Grid container>
      <Grid item xs={12}>
        <Typography variant="body2" color="textSecondary" align="center">
          Follow the steps on the Device
        </Typography>
        <br />
        <DynamicTextView state={confirmed} text="Confirm on Device" />
        <br />
        <DynamicTextView state={verified} text="Device Authentication" />
      </Grid>
    </Grid>
  );
};

Authentication.propTypes = {
  isCompleted: PropTypes.oneOf<-1 | 0 | 1 | 2>([-1, 0, 1, 2]).isRequired,
  setCompleted: PropTypes.func.isRequired,
  errorObj: PropTypes.instanceOf(DisplayError).isRequired,
  cancelDeviceAuth: PropTypes.func.isRequired,
  completed: PropTypes.bool.isRequired,
  confirmed: PropTypes.oneOf<-1 | 0 | 1 | 2>([-1, 0, 1, 2]).isRequired,
  verified: PropTypes.oneOf<-1 | 0 | 1 | 2>([-1, 0, 1, 2]).isRequired,
  handleDeviceAuth: PropTypes.func.isRequired,
  resetHooks: PropTypes.func.isRequired
};

export default Authentication;
