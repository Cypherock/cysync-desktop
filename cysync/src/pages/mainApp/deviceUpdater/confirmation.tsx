import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import CustomButton from '../../../designSystem/designComponents/buttons/button';
import { DeviceConnectionState, useConnection } from '../../../store/provider';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';

const PREFIX = 'DeviceUpdater-Confirmation';

const classes = {
  container: `${PREFIX}-container`,
  errorButtons: `${PREFIX}-errorButtons`
};

const Root = styled(Grid)(() => ({
  padding: '20px',
  [`& .${classes.errorButtons}`]: {
    display: 'flex',
    justifyContent: 'space-around',
    width: '100%'
  }
}));

type Props = {
  handleClose: (val: boolean) => void;
  updateRequiredType?: string;
};

const Confirmation: React.FC<Props> = ({ handleClose, updateRequiredType }) => {
  const { retryConnection, deviceConnectionState } = useConnection();

  const getHeading = () => {
    const defaultText = 'Looks like the device is not initialised';
    switch (deviceConnectionState) {
      case DeviceConnectionState.IN_TEST_APP:
        return 'Looks like the device is not initialised';
      case DeviceConnectionState.IN_BOOTLOADER:
        return 'Looks like your device was disconnected while updating';
      case DeviceConnectionState.PARTIAL_STATE:
        return 'Looks like your device is not authenticated';
      case DeviceConnectionState.NEW_DEVICE:
        return 'Looks like this device is connected for the first time';
      case DeviceConnectionState.LAST_AUTH_FAILED:
        return 'Looks like the device authentication failed the last time';
      case DeviceConnectionState.DEVICE_NOT_READY:
        return 'Looks like the device is not in the main menu';
      case DeviceConnectionState.UNKNOWN_ERROR:
        return 'An unknown error occurred while connecting the device';
      case DeviceConnectionState.UPDATE_REQUIRED:
        if (updateRequiredType === 'app') {
          return 'The current version of CySync is not compatible with the device connected';
        }

        if (updateRequiredType === 'device') {
          return 'The current version of X1 wallet is not compatible with this CySync';
        }

        return 'The current versions of CySync and X1 wallet are not compatible';
      default:
        return defaultText;
    }
  };

  const getQuestion = () => {
    const defaultText = 'Do you want to initialise it now?';
    switch (deviceConnectionState) {
      case DeviceConnectionState.IN_TEST_APP:
        return 'Do you want to initialise it now?';
      case DeviceConnectionState.IN_BOOTLOADER:
        return 'Do you want to complete the upgrade now?';
      case DeviceConnectionState.PARTIAL_STATE:
        return 'Do you want to complete the authentication now?';
      case DeviceConnectionState.NEW_DEVICE:
        return 'Do you want to setup the device now?';
      case DeviceConnectionState.LAST_AUTH_FAILED:
        return 'Do you want to retry the authentication now?';
      case DeviceConnectionState.DEVICE_NOT_READY:
        return 'Bring the device to the main menu and try again.';
      case DeviceConnectionState.UNKNOWN_ERROR:
        return 'Reconnect the device and try again';
      case DeviceConnectionState.UPDATE_REQUIRED:
        if (updateRequiredType === 'app') {
          return 'Update CySync from https://cypherock.com/gs';
        }

        if (updateRequiredType === 'device') {
          return 'Update the X1 wallet';
        }

        return 'Make sure both CySync and X1 wallet are updated from https://cypherock.com/gs';
      default:
        return defaultText;
    }
  };

  const getPositiveBtnText = () => {
    switch (deviceConnectionState) {
      case DeviceConnectionState.IN_TEST_APP:
      case DeviceConnectionState.IN_BOOTLOADER:
      case DeviceConnectionState.PARTIAL_STATE:
      case DeviceConnectionState.NEW_DEVICE:
      case DeviceConnectionState.LAST_AUTH_FAILED:
        return 'Yes';
      case DeviceConnectionState.DEVICE_NOT_READY:
        return 'Try again';
      case DeviceConnectionState.UNKNOWN_ERROR:
        return 'Ok';
      case DeviceConnectionState.UPDATE_REQUIRED:
        if (updateRequiredType === 'device') {
          return 'Yes';
        }

        return 'Ok';
      default:
        return 'Ok';
    }
  };

  const getNegativeBtnText = (): string | undefined => {
    switch (deviceConnectionState) {
      case DeviceConnectionState.IN_TEST_APP:
      case DeviceConnectionState.IN_BOOTLOADER:
      case DeviceConnectionState.PARTIAL_STATE:
      case DeviceConnectionState.NEW_DEVICE:
      case DeviceConnectionState.LAST_AUTH_FAILED:
      case DeviceConnectionState.DEVICE_NOT_READY:
      case DeviceConnectionState.UNKNOWN_ERROR:
      case DeviceConnectionState.UPDATE_REQUIRED:
      default:
        return undefined;
    }
  };

  const onNegativeClick = () => {
    handleClose(false);
  };

  const onPositiveClick = () => {
    switch (deviceConnectionState) {
      case DeviceConnectionState.IN_TEST_APP:
      case DeviceConnectionState.IN_BOOTLOADER:
      case DeviceConnectionState.PARTIAL_STATE:
      case DeviceConnectionState.NEW_DEVICE:
      case DeviceConnectionState.LAST_AUTH_FAILED:
        handleClose(true);
        break;
      case DeviceConnectionState.DEVICE_NOT_READY:
        logger.info('Retry device connection by user');
        Analytics.Instance.event(
          Analytics.Categories.RETRY_DEVICE_CONNECTION,
          Analytics.Actions.CLICKED
        );
        retryConnection();
        handleClose(false);
        break;
      case DeviceConnectionState.UNKNOWN_ERROR:
        handleClose(false);
        break;
      case DeviceConnectionState.UPDATE_REQUIRED:
        handleClose(true);
        break;
      default:
        handleClose(false);
    }
  };

  return (
    <Root container>
      <Grid item xs={12}>
        <Typography
          variant="h4"
          style={{ margin: 'auto', marginBottom: '30px' }}
          align="center"
        >
          {getHeading()}
        </Typography>
        <Typography
          variant="h5"
          align="center"
          style={{ margin: 'auto', marginBottom: '15px' }}
        >
          {getQuestion()}
        </Typography>
      </Grid>
      <div className={classes.errorButtons}>
        {getNegativeBtnText() && (
          <CustomButton
            onClick={onNegativeClick}
            variant="outlined"
            style={{ margin: '1rem 0rem', textTransform: 'none' }}
          >
            {getNegativeBtnText()}
          </CustomButton>
        )}
        <CustomButton
          onClick={onPositiveClick}
          style={{ margin: '1rem 0rem' }}
          autoFocus
        >
          {getPositiveBtnText()}
        </CustomButton>
      </div>
    </Root>
  );
};

Confirmation.propTypes = {
  handleClose: PropTypes.func.isRequired,
  updateRequiredType: PropTypes.string
};

export default Confirmation;
