import Grid from '@mui/material/Grid';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import CustomButton from '../../../designSystem/designComponents/buttons/button';
import { useConnection } from '../../../store/provider';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';

const useStyles = makeStyles(() =>
  createStyles({
    container: {
      padding: '20px'
    },
    errorButtons: {
      display: 'flex',
      justifyContent: 'space-around',
      width: '100%'
    }
  })
);

type Props = {
  handleClose: (val: boolean) => void;
  state: number;
  updateRequiredType?: string;
};

const Confirmation: React.FC<Props> = ({
  handleClose,
  state,
  updateRequiredType
}) => {
  const classes = useStyles();
  const { retryConnection } = useConnection();

  const getHeading = () => {
    const defaultText = 'Looks like the device is not configured.';
    switch (state) {
      case 1:
        return 'Looks like the device is not configured.';
      case 2:
        return 'Looks like your device was disconnected while upgrading.';
      case 3:
        return 'Looks like your device is not authenticated.';
      case 4:
        return 'Looks like this device is connected for the first time.';
      case 5:
        return 'Looks like the device authentication failed the last time.';
      case 6:
        return 'Looks like the device is not in the main menu.';
      case 7:
        return 'An unknown error occurred while connecting the device.';
      case 8:
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
    switch (state) {
      case 1:
        return 'Do you want to configure it now?';
      case 2:
        return 'Do you want to complete the upgrade now?';
      case 3:
        return 'Do you want to complete the authentication now?';
      case 4:
        return 'Do you want to setup the device now?';
      case 5:
        return 'Do you want to retry the authentication now?';
      case 6:
        return 'Please bring the device to the main menu and try again.';
      case 7:
        return 'Please reconnect the device and try again';
      case 8:
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
    switch (state) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        return 'Yes';
      case 6:
        return 'Try again';
      case 7:
        return 'Ok';
      case 8:
        if (updateRequiredType === 'device') {
          return 'Yes';
        }
        break;
      default:
        return 'Ok';
    }
  };

  const getNegativeBtnText = () => {
    switch (state) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        return 'No';
      case 6:
        return 'Cancel';
      case 7:
        return undefined;
      case 8:
        return 'Cancel';
      default:
        return undefined;
    }
  };

  const onNegativeClick = () => {
    handleClose(false);
  };

  const onPositiveClick = () => {
    switch (state) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
        handleClose(true);
        break;
      case 6:
        logger.info('Retry device connection by user');
        Analytics.Instance.event(
          Analytics.Categories.RETRY_DEVICE_CONNECTION,
          Analytics.Actions.CLICKED
        );
        retryConnection();
        handleClose(false);
        break;
      case 7:
        handleClose(false);
        break;
      case 8:
        handleClose(true);
        break;
      default:
        handleClose(false);
    }
  };

  return (
    <Grid className={classes.container} container>
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
    </Grid>
  );
};

Confirmation.propTypes = {
  state: PropTypes.number.isRequired,
  handleClose: PropTypes.func.isRequired,
  updateRequiredType: PropTypes.string
};

export default Confirmation;
