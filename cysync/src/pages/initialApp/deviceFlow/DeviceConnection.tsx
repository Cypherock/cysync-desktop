import ReportIcon from '@mui/icons-material/Report';
import { IconButton } from '@mui/material';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import Icon from '../../../designSystem/designComponents/icons/Icon';
import TextView from '../../../designSystem/designComponents/textComponents/textView';
import DeviceWired from '../../../designSystem/iconGroups/deviceWired';
import {
  DeviceConnectionState,
  FeedbackState,
  useConnection,
  useFeedback
} from '../../../store/provider';
import { inTestApp } from '../../../utils/compareVersion';
import logger from '../../../utils/logger';

const PREFIX = 'DeviceConnection';

const classes = {
  content: `${PREFIX}-content`,
  heading: `${PREFIX}-heading`,
  start: `${PREFIX}-start`,
  deviceIcon: `${PREFIX}-deviceIcon`,
  deviceTextContainer: `${PREFIX}-deviceTextContainer`,
  report: `${PREFIX}-report`
};

const Root = styled('div')(() => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  paddingTop: '7rem',
  [`& .${classes.content}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.heading}`]: {
    paddingTop: '2rem'
  },
  [`& .${classes.start}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  [`& .${classes.deviceIcon}`]: {
    position: 'absolute',
    left: '50%',
    top: '2vh',
    transform: 'translateX(-50%)'
  },
  [`& .${classes.deviceTextContainer}`]: {
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
  [`& .${classes.report}`]: {
    position: 'absolute',
    right: 10,
    bottom: 120
  }
}));

const DeviceConnection = ({ handleNext, handleDeviceConnected }: any) => {
  const { showFeedback, closeFeedback } = useFeedback();

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

  const [connected, setConnected] = React.useState(false);

  const {
    internalDeviceConnection: deviceConnection,
    inBackgroundProcess,
    deviceConnectionState,
    deviceState
  } = useConnection();

  const handleConnected = () => {
    setConnected(true);

    setTimeout(() => {
      handleNext();
    }, 1000);
  };

  useEffect(() => {
    if (
      deviceConnection &&
      !inBackgroundProcess &&
      deviceConnectionState !== DeviceConnectionState.NOT_CONNECTED
    ) {
      if (deviceConnectionState === DeviceConnectionState.IN_TEST_APP) {
        // When in test app, start initialFlow
        logger.info('Device connected in test app.');
        handleConnected();
      } else if (
        !inTestApp(deviceState) ||
        deviceConnectionState === DeviceConnectionState.IN_BOOTLOADER
      ) {
        // When in main or bootloader, skip initialFlow
        logger.info('Device connected in main app or bootloader mode.');
        localStorage.setItem('initialFlow', 'true');
        handleDeviceConnected();
      }
    }
  }, [deviceConnection, inBackgroundProcess]);

  useEffect(() => {
    return () => {
      closeFeedback();
    };
  }, []);

  return (
    <Root>
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
        size="large"
      >
        <ReportIcon color="secondary" />
      </IconButton>
    </Root>
  );
};

DeviceConnection.propTypes = {
  handleDeviceConnected: PropTypes.func.isRequired,
  handleNext: PropTypes.func.isRequired
};

export default DeviceConnection;
