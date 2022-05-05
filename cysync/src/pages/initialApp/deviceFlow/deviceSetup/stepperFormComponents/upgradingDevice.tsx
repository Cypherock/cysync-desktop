import ReportIcon from '@mui/icons-material/Report';
import AlertIcon from '@mui/icons-material/ReportProblemOutlined';
import { IconButton } from '@mui/material';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useEffect } from 'react';

import success from '../../../../../assets/icons/generic/success.png';
import CustomButton from '../../../../../designSystem/designComponents/buttons/button';
import AvatarIcon from '../../../../../designSystem/designComponents/icons/AvatarIcon';
import Icon from '../../../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../../../designSystem/iconGroups/errorExclamation';
import { useDeviceUpgrade } from '../../../../../store/hooks/flows';
import {
  FeedbackState,
  useFeedback,
  useNetwork
} from '../../../../../store/provider';
import Analytics from '../../../../../utils/analytics';
import logger from '../../../../../utils/logger';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'DeviceSetupUpgrade';

const classes = {
  middle: `${PREFIX}-middle`,
  progress: `${PREFIX}-progress`,
  success: `${PREFIX}-success`,
  center: `${PREFIX}-center`,
  primaryColor: `${PREFIX}-primaryColor`,
  report: `${PREFIX}-report`,
  errorButtons: `${PREFIX}-errorButtons`
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
    flexDirection: 'row',
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
  },
  [`& .${classes.report}`]: {
    position: 'absolute',
    right: 20,
    bottom: 20
  },
  [`& .${classes.errorButtons}`]: {
    display: 'flex',
    justifyContent: 'space-around',
    width: '100%'
  }
}));

const UpgradingDevice: React.FC<StepComponentProps> = ({
  handleDeviceConnected
}) => {
  const { connected } = useNetwork();

  const {
    startDeviceUpdate,
    handleRetry,
    deviceConnection,
    isCompleted,
    displayErrorMessage,
    setDisplayErrorMessage,
    isInternetSlow,
    updateDownloaded,
    errorMessage,
    latestVersion,
    setUpdated,
    setIsCompleted
  } = useDeviceUpgrade(true);

  const refreshComponent = () => {
    handleRetry();
  };

  useEffect(() => {
    Analytics.Instance.event(
      Analytics.Categories.INITIAL_DEVICE_UPDATE,
      Analytics.Actions.OPEN
    );
    logger.info('InitialDeviceUpdate: Opened');

    return () => {
      Analytics.Instance.event(
        Analytics.Categories.INITIAL_DEVICE_UPDATE,
        Analytics.Actions.CLOSED
      );
      logger.info('InitialDeviceUpdate: Closed');
    };
  }, []);

  useEffect(() => {
    logger.info('Initiating device update from initial setup');
    if (!deviceConnection) {
      logger.info('Failed due to device not connected');
      setDisplayErrorMessage('Please connect the device and try again.');
      setUpdated(-1);
      setIsCompleted(-1);
      return () => {
        // empty
      };
    }

    startDeviceUpdate();

    return () => {
      logger.info('Closed device update screen');
    };
  }, []);

  useEffect(() => {
    if (isCompleted === -1) {
      Analytics.Instance.event(
        Analytics.Categories.INITIAL_DEVICE_UPDATE,
        Analytics.Actions.ERROR
      );
      logger.info('InitialDeviceUpdate: Error');
    } else if (isCompleted === 2) {
      Analytics.Instance.event(
        Analytics.Categories.INITIAL_DEVICE_UPDATE,
        Analytics.Actions.COMPLETED
      );
      logger.info('InitialDeviceUpdate: Completed');
      setTimeout(handleDeviceConnected, 350);
    }
  }, [isCompleted]);

  const { showFeedback } = useFeedback();

  const newFeedbackState: FeedbackState = {
    attachLogs: true,
    attachDeviceLogs: false,
    categories: ['Report'],
    category: 'Report',
    description: displayErrorMessage || errorMessage,
    descriptionError: '',
    email: '',
    emailError: '',
    subject: 'Reporting for Error (Upgrading Device)',
    subjectError: ''
  };

  const handleFeedbackOpen = () => {
    showFeedback({
      isContact: true,
      heading: 'Report',
      initFeedbackState: newFeedbackState
    });
  };

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
              Please wait while we download the latest firmware from the
              internet
            </Typography>
            <Typography variant="body2" color="textPrimary" align="center">
              It might take a few seconds ...
            </Typography>
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
        {isCompleted === 2 && (
          <>
            <div className={classes.success}>
              <AvatarIcon alt="success" src={success} size="small" />
              <Typography color="secondary" variant="h5">
                Device upgraded Successfully
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
                {displayErrorMessage}
              </Typography>
            </div>
            <div className={classes.errorButtons}>
              <CustomButton
                onClick={refreshComponent}
                style={{ marginTop: '2rem' }}
              >
                Try Again
              </CustomButton>
              <CustomButton
                onClick={handleFeedbackOpen}
                style={{ marginTop: '2rem' }}
              >
                Contact Us
              </CustomButton>
            </div>
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
      <IconButton
        title="Report issue"
        onClick={handleFeedbackOpen}
        className={classes.report}
        size="large"
      >
        <ReportIcon color="secondary" />
      </IconButton>
    </Root>
  );
};

UpgradingDevice.propTypes = StepComponentPropTypes;

export default UpgradingDevice;
