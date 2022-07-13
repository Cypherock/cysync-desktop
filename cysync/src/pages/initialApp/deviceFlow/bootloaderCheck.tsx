import AlertIcon from '@mui/icons-material/ReportProblemOutlined';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useEffect } from 'react';

import success from '../../../assets/icons/generic/success.png';
import CustomButton from '../../../designSystem/designComponents/buttons/button';
import AvatarIcon from '../../../designSystem/designComponents/icons/AvatarIcon';
import Icon from '../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../designSystem/iconGroups/errorExclamation';
import { useDeviceUpgrade } from '../../../store/hooks/flows';
import { useConnection } from '../../../store/provider';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';

const PREFIX = 'BootloaderCheck';

const classes = {
  middle: `${PREFIX}-middle`,
  progress: `${PREFIX}-progress`,
  success: `${PREFIX}-success`,
  center: `${PREFIX}-center`,
  primaryColor: `${PREFIX}-primaryColor`
};

const Root = styled(Grid)(({ theme }) => ({
  [`& .${classes.middle}`]: {
    minHeight: '20rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.progress}`]: {
    marginBottom: '3rem',
    color: theme.palette.text.secondary
  },
  [`& .${classes.success}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.center}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  [`& .${classes.primaryColor}`]: {
    color: theme.palette.secondary.dark
  }
}));

const BootloaderCheck = (props: any) => {
  const { connected, inBootloader } = useConnection();

  const {
    startDeviceUpdate,
    handleRetry,
    isCompleted,
    isInternetSlow,
    updateDownloaded,
    latestVersion,
    setBlockNewConnection,
    errorObj
  } = useDeviceUpgrade(true);

  const refreshComponent = () => {
    handleRetry();
  };

  const onClose = () => {
    setBlockNewConnection(false);
    props.handlePrev();
  };

  useEffect(() => {
    if (!inBootloader) {
      logger.info('BootloaderCheck: Not in bootloader mode');
      props.handleNext();
      return;
    }

    logger.info('Initiating device update from bootloader check');
    startDeviceUpdate();

    return () => {
      setBlockNewConnection(false);
    };
  }, []);

  useEffect(() => {
    Analytics.Instance.event(
      Analytics.Categories.BOOTLOADER_CHECK,
      Analytics.Actions.OPEN
    );
    logger.info('BootloaderCheck: Opened');

    return () => {
      Analytics.Instance.event(
        Analytics.Categories.BOOTLOADER_CHECK,
        Analytics.Actions.CLOSED
      );
      logger.info('BootloaderCheck: Closed');
    };
  }, []);

  useEffect(() => {
    if (isCompleted === -1) {
      Analytics.Instance.event(
        Analytics.Categories.BOOTLOADER_CHECK,
        Analytics.Actions.ERROR
      );
    } else if (isCompleted === 2) {
      Analytics.Instance.event(
        Analytics.Categories.BOOTLOADER_CHECK,
        Analytics.Actions.COMPLETED
      );
      setTimeout(onClose, 3000);
    }
  }, [isCompleted]);

  return (
    <Root container>
      <Grid item xs={2} />
      <Grid item xs={8} className={classes.middle}>
        {isCompleted === 0 && updateDownloaded !== 2 && (
          <>
            {isInternetSlow ? (
              <>
                <Alert severity="warning" variant="outlined">
                  Your Internet connection is slow
                </Alert>
                <br />
              </>
            ) : null}
            <CircularProgress className={classes.progress} size={70} />
            <Typography
              variant="h4"
              color="textPrimary"
              align="center"
              style={{ marginBottom: '1.5rem' }}
            >
              Please wait while we download the latest firmware
            </Typography>
            <Typography variant="body2" color="textPrimary" align="center">
              It might take a few seconds ...
            </Typography>
          </>
        )}
        {isCompleted === 2 && (
          <>
            <div className={classes.success}>
              <AvatarIcon alt="success" src={success} />
              <Typography color="secondary" variant="h5">
                Device configured Successfully
              </Typography>
            </div>
          </>
        )}
        {isCompleted === -1 && (
          <>
            <div className={classes.success}>
              <Icon
                viewBox="0 0 60 60"
                size={50}
                iconGroup={<ErrorExclamation />}
              />
              <Typography color="error" variant="h5">
                {errorObj.showError()}
              </Typography>
            </div>
            <CustomButton
              onClick={refreshComponent}
              style={{ marginTop: '2rem' }}
            >
              Try Again
            </CustomButton>
          </>
        )}
        {isCompleted === 0 && updateDownloaded === 2 && (
          <>
            <CircularProgress className={classes.progress} size={70} />
            <Typography
              variant="h4"
              color="textPrimary"
              align="center"
              style={{ marginBottom: '1.5rem' }}
            >
              {`Please confirm the update on the device to version ${latestVersion}`}
            </Typography>
            <div className={classes.center} style={{ margin: '15px 0' }}>
              <AlertIcon
                className={classes.primaryColor}
                style={{ marginRight: '5px' }}
              />
              <Typography variant="body2" color="textSecondary" align="center">
                Do not disconnect device while it is being updated. This may
                take a few minutes.
              </Typography>
            </div>
            {connected || (
              <div style={{ marginTop: '10px' }} className={classes.success}>
                <Icon
                  size={50}
                  viewBox="0 0 60 60"
                  iconGroup={<ErrorExclamation />}
                />
                <Typography variant="body2" color="secondary">
                  Internet connection is required for this action
                </Typography>
              </div>
            )}
          </>
        )}
        {isCompleted === 1 && updateDownloaded === 2 && (
          <>
            <CircularProgress className={classes.progress} size={70} />
            <Typography
              variant="h4"
              color="textPrimary"
              align="center"
              style={{ marginBottom: '1.5rem' }}
            >
              {`Please wait while Cypherock X1 is Upgrading to version ${latestVersion}`}
            </Typography>
            <div className={classes.center} style={{ margin: '15px 0' }}>
              <AlertIcon
                className={classes.primaryColor}
                style={{ marginRight: '5px' }}
              />
              <Typography variant="body2" color="textSecondary" align="center">
                Do not disconnect device while it is being updated. This may
                take a few minutes.
              </Typography>
            </div>
            {connected || (
              <div style={{ marginTop: '10px' }} className={classes.success}>
                <Icon
                  size={50}
                  viewBox="0 0 60 60"
                  iconGroup={<ErrorExclamation />}
                />
                <Typography variant="body2" color="secondary">
                  Internet connection is required for this action
                </Typography>
              </div>
            )}
          </>
        )}
      </Grid>
      <Grid item xs={2} />
    </Root>
  );
};

export default BootloaderCheck;
