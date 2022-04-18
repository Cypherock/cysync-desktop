import { IconButton } from '@mui/material';
import Grid from '@mui/material/Grid';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import Typography from '@mui/material/Typography';
import ReportIcon from '@mui/icons-material/Report';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import Icon from '../../../designSystem/designComponents/icons/Icon';
import TextView from '../../../designSystem/designComponents/textComponents/textView';
import DeviceWired from '../../../designSystem/iconGroups/deviceWired';
import {
  FeedbackState,
  useConnection,
  useFeedback
} from '../../../store/provider';
import { inTestApp } from '../../../utils/compareVersion';
import logger from '../../../utils/logger';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      paddingTop: '7rem'
    },
    content: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    },
    heading: {
      paddingTop: '2rem'
    },
    start: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-end'
    },
    deviceIcon: {
      position: 'absolute',
      left: '50%',
      top: '2vh',
      transform: 'translateX(-50%)'
    },
    deviceTextContainer: {
      position: 'absolute',
      top: '51%',
      right: '35%',
      width: '236px',
      height: '120px',
      transform: 'translate(50%, -50%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      borderRadius: '2px',
      padding: '2px',
      color: '#fff'
    },
    report: {
      position: 'absolute',
      right: 10,
      bottom: 120
    }
  })
);

const DeviceConnection = ({ handleNext, handleDeviceConnected }: any) => {
  const { showFeedback } = useFeedback();

  const newFeedbackState: FeedbackState = {
    attachLogs: true,
    attachDeviceLogs: false,
    categories: ['Report'],
    category: 'Report',
    description: '',
    descriptionError: '',
    email: '',
    emailError: '',
    subject: 'Reporting for Error (Device Connection)',
    subjectError: ''
  };

  const handleFeedbackOpen = () => {
    showFeedback({
      isContact: true,
      heading: 'Report',
      initFeedbackState: newFeedbackState
    });
  };

  const classes = useStyles();
  const [connected, setConnected] = React.useState(false);

  const {
    internalDeviceConnection: deviceConnection,
    inBackgroundProcess,
    verifyState,
    deviceState
  } = useConnection();

  const handleConnected = () => {
    setConnected(true);

    setTimeout(() => {
      handleNext();
    }, 1000);
  };

  useEffect(() => {
    if (deviceConnection && !inBackgroundProcess && verifyState !== -1) {
      if ([1, 2].includes(verifyState)) {
        // When in bootloader or test app, start initialFlow
        logger.info('Device connected in bootloader mode or test app.');
        handleConnected();
      } else if (!inTestApp(deviceState)) {
        // When in main, skip initialFlow
        logger.info('Device connected in main app.');
        localStorage.setItem('initialFlow', 'true');
        handleDeviceConnected();
      }
    }
  }, [deviceConnection, inBackgroundProcess]);

  return (
    <div className={classes.root}>
      <div className={classes.heading}>
        <Typography
          color="textPrimary"
          variant="h2"
          align="center"
          style={{ letterSpacing: 3 }}
        >
          Connect Device
        </Typography>
      </div>
      <Grid style={{ marginTop: '2rem' }} container justifyContent="center">
        <Grid item xs={4} className={classes.content}>
          <TextView
            text="Connect X1 Wallet"
            completed={connected}
            inProgress={!connected}
          />
        </Grid>
      </Grid>
      <div className={classes.deviceIcon}>
        <Icon
          style={{ transform: 'rotate(90deg)' }}
          size={1000}
          viewBox="0 0 468 472"
          iconGroup={<DeviceWired />}
        />
        <div className={classes.deviceTextContainer}>
          <Typography style={{ fontSize: '18px' }} variant="subtitle1">
            Follow the instructions on X1 Wallet.
          </Typography>
        </div>
      </div>
      <IconButton
        title="Report issue"
        onClick={handleFeedbackOpen}
        className={classes.report}
        size="large">
        <ReportIcon color="secondary" />
      </IconButton>
    </div>
  );
};

DeviceConnection.propTypes = {
  handleDeviceConnected: PropTypes.func.isRequired,
  handleNext: PropTypes.func.isRequired
};

export default DeviceConnection;
