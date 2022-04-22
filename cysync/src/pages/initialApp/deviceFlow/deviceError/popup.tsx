import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import CustomButton from '../../../../designSystem/designComponents/buttons/button';
import { useConnection } from '../../../../store/provider';
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
  handleClose: () => void;
  state: number;
};

const Popup: React.FC<Props> = ({ handleClose, state }) => {
  const { retryConnection } = useConnection();

  const getHeading = () => {
    switch (state) {
      case 6:
        return 'Looks like the device is not in the main menu.';
      case 7:
        return 'An unknown error occurred while connecting the device.';
      default:
        return 'An unknown error occurred while connecting the device.';
    }
  };

  const getQuestion = () => {
    switch (state) {
      case 6:
        return 'Please bring the device to the main menu and try again.';
      case 7:
        return 'Please reconnect the device and try again';
      default:
        return 'Please reconnect the device and try again';
    }
  };

  const getPositiveBtnText = () => {
    switch (state) {
      case 6:
        return 'Try again';
      case 7:
      default:
        return 'Ok';
    }
  };

  const getNegativeBtnText = () => {
    switch (state) {
      case 6:
        return 'Cancel';
      case 7:
      default:
        return undefined;
    }
  };

  const onNegativeClick = () => {
    handleClose();
  };

  const onPositiveClick = () => {
    switch (state) {
      case 6:
        logger.info('Retry device connection by user');
        Analytics.Instance.event(
          Analytics.Categories.RETRY_DEVICE_CONNECTION,
          Analytics.Actions.CLICKED
        );
        retryConnection();
        handleClose();
        break;
      case 7:
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
  state: PropTypes.number.isRequired,
  handleClose: PropTypes.func.isRequired
};

export default Popup;
