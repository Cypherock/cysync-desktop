import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import CustomButton from '../../../designSystem/designComponents/buttons/button';
import { useConnection, VerifyState } from '../../../store/provider';
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
  const { retryConnection, verifyState } = useConnection();

  const getHeading = () => {
    const defaultText = 'Looks like the device is not configured.';
    switch (verifyState) {
      case VerifyState.IN_TEST_APP:
        return 'Looks like the device is not configured.';
      case VerifyState.IN_BOOTLOADER:
        return 'Looks like your device was disconnected while upgrading.';
      case VerifyState.PARTIAL_STATE:
        return 'Looks like your device is not authenticated.';
      case VerifyState.NEW_DEVICE:
        return 'Looks like this device is connected for the first time.';
      case VerifyState.LAST_AUTH_FAILED:
        return 'Looks like the device authentication failed the last time.';
      case VerifyState.DEVICE_NOT_READY:
        return 'Looks like the device is not in the main menu.';
      case VerifyState.UNKNOWN_ERROR:
        return 'An unknown error occurred while connecting the device.';
      case VerifyState.UPDATE_REQUIRED:
        if (updateRequiredType === 'app') {
          return 'The current version of CySync is not compatible with the device connected.';
        }

        if (updateRequiredType === 'device') {
          return 'The current version of X1 wallet is not compatible with this CySync.';
        }

        return 'The current versions of CySync and X1 wallet are not compatible.';
      default:
        return defaultText;
    }
  };

  const getQuestion = () => {
    const defaultText = 'Do you want to configure it now?';
    switch (verifyState) {
      case VerifyState.IN_TEST_APP:
        return 'Do you want to configure it now?';
      case VerifyState.IN_BOOTLOADER:
        return 'Do you want to complete the upgrade now?';
      case VerifyState.PARTIAL_STATE:
        return 'Do you want to complete the authentication now?';
      case VerifyState.NEW_DEVICE:
        return 'Do you want to setup the device now?';
      case VerifyState.LAST_AUTH_FAILED:
        return 'Do you want to retry the authentication now?';
      case VerifyState.DEVICE_NOT_READY:
        return 'Please bring the device to the main menu and try again.';
      case VerifyState.UNKNOWN_ERROR:
        return 'Please reconnect the device and try again';
      case VerifyState.UPDATE_REQUIRED:
        if (updateRequiredType === 'app') {
          return 'Please update CySync from https://cypherock.com/gs';
        }

        if (updateRequiredType === 'device') {
          return 'Please update the X1 wallet';
        }

        return 'Please make sure both CySync and X1 wallet are updated from https://cypherock.com/gs';
      default:
        return defaultText;
    }
  };

  const getPositiveBtnText = () => {
    switch (verifyState) {
      case VerifyState.IN_TEST_APP:
      case VerifyState.IN_BOOTLOADER:
      case VerifyState.PARTIAL_STATE:
      case VerifyState.NEW_DEVICE:
      case VerifyState.LAST_AUTH_FAILED:
        return 'Yes';
      case VerifyState.DEVICE_NOT_READY:
        return 'Try again';
      case VerifyState.UNKNOWN_ERROR:
        return 'Ok';
      case VerifyState.UPDATE_REQUIRED:
        if (updateRequiredType === 'device') {
          return 'Yes';
        }
        break;
      default:
        return 'Ok';
    }
  };

  const getNegativeBtnText = () => {
    switch (verifyState) {
      case VerifyState.IN_TEST_APP:
      case VerifyState.IN_BOOTLOADER:
      case VerifyState.PARTIAL_STATE:
      case VerifyState.NEW_DEVICE:
      case VerifyState.LAST_AUTH_FAILED:
        return 'No';
      case VerifyState.DEVICE_NOT_READY:
        return 'Cancel';
      case VerifyState.UNKNOWN_ERROR:
        return undefined;
      case VerifyState.UPDATE_REQUIRED:
        return 'Cancel';
      default:
        return undefined;
    }
  };

  const onNegativeClick = () => {
    handleClose(false);
  };

  const onPositiveClick = () => {
    switch (verifyState) {
      case VerifyState.IN_TEST_APP:
      case VerifyState.IN_BOOTLOADER:
      case VerifyState.PARTIAL_STATE:
      case VerifyState.NEW_DEVICE:
      case VerifyState.LAST_AUTH_FAILED:
        handleClose(true);
        break;
      case VerifyState.DEVICE_NOT_READY:
        logger.info('Retry device connection by user');
        Analytics.Instance.event(
          Analytics.Categories.RETRY_DEVICE_CONNECTION,
          Analytics.Actions.CLICKED
        );
        retryConnection();
        handleClose(false);
        break;
      case VerifyState.UNKNOWN_ERROR:
        handleClose(false);
        break;
      case VerifyState.UPDATE_REQUIRED:
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
        <CustomButton onClick={onPositiveClick} style={{ margin: '1rem 0rem' }}>
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
