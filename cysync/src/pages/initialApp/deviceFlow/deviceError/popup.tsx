import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import CustomButton from '../../../../designSystem/designComponents/buttons/button';
import {
  DeviceConnectionState,
  useConnection
} from '../../../../store/provider';
import Analytics from '../../../../utils/analytics';
import logger from '../../../../utils/logger';

const PREFIX = 'DeviceErrorPopup';

const classes = {
  container: `${PREFIX}-container`,
  errorButtons: `${PREFIX}-errorButtons`
};

const Root = styled(Grid)(() => ({
  [`& .${classes.container}`]: {
    padding: '20px'
  },
  [`& .${classes.errorButtons}`]: {
    display: 'flex',
    justifyContent: 'space-around',
    width: '100%'
  }
}));

type Props = {
  handleClose: (val?: boolean) => void;
};

const Popup: React.FC<Props> = ({ handleClose }) => {
  const { retryConnection, updateRequiredType, deviceConnectionState } =
    useConnection();

  const getHeading = () => {
    switch (deviceConnectionState) {
      case DeviceConnectionState.DEVICE_NOT_READY:
        return 'Looks like the device is not in the main menu.';
      case DeviceConnectionState.UNKNOWN_ERROR:
        return 'An unknown error occurred while connecting the device.';
      case DeviceConnectionState.UPDATE_REQUIRED:
        if (updateRequiredType === 'app') {
          return 'The current version of CySync is not compatible with the X1 wallet connected';
        }

        if (updateRequiredType === 'device') {
          return 'The current version of X1 wallet is not compatible with this CySync';
        }

        return 'The current versions of CySync and X1 wallet are not compatible';
      default:
        return 'An unknown error occurred while connecting the device.';
    }
  };

  const getQuestion = () => {
    switch (deviceConnectionState) {
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
        return 'Reconnect the device and try again';
    }
  };

  const getPositiveBtnText = () => {
    switch (deviceConnectionState) {
      case DeviceConnectionState.DEVICE_NOT_READY:
        return 'Try again';
      case DeviceConnectionState.UPDATE_REQUIRED:
        if (updateRequiredType === 'device') {
          return 'Yes';
        }

        return 'Ok';
      case DeviceConnectionState.UNKNOWN_ERROR:
      default:
        return 'Ok';
    }
  };

  const getNegativeBtnText = () => {
    switch (deviceConnectionState) {
      case DeviceConnectionState.DEVICE_NOT_READY:
        return 'Cancel';
      case DeviceConnectionState.UPDATE_REQUIRED:
      case DeviceConnectionState.UNKNOWN_ERROR:
      default:
        return undefined;
    }
  };

  const onNegativeClick = () => {
    handleClose();
  };

  const onPositiveClick = () => {
    switch (deviceConnectionState) {
      case DeviceConnectionState.DEVICE_NOT_READY:
        logger.info('Retry device connection by user');
        Analytics.Instance.event(
          Analytics.Categories.RETRY_DEVICE_CONNECTION,
          Analytics.Actions.CLICKED
        );
        retryConnection();
        handleClose();
        break;
      case DeviceConnectionState.UPDATE_REQUIRED:
        handleClose(true);
        break;
      case DeviceConnectionState.UNKNOWN_ERROR:
      default:
        handleClose();
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

Popup.propTypes = {
  handleClose: PropTypes.func.isRequired
};

export default Popup;
