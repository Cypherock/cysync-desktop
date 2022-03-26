import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import CustomButton from '../../../../designSystem/designComponents/buttons/button';
import { useConnection } from '../../../../store/provider';
import Analytics from '../../../../utils/analytics';
import logger from '../../../../utils/logger';

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
  handleClose: () => void;
  state: number;
};

const Popup: React.FC<Props> = ({ handleClose, state }) => {
  const classes = useStyles();
  const { retryConnection } = useConnection();

  const getHeading = () => {
    switch (state) {
      case 6:
        return 'Looks like the device is not in the main menu.';
      case 7:
        return 'An unknown error occured while connecting the device.';
      default:
        return 'An unknown error occured while connecting the device.';
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
            color="default"
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

Popup.propTypes = {
  state: PropTypes.number.isRequired,
  handleClose: PropTypes.func.isRequired
};

export default Popup;
