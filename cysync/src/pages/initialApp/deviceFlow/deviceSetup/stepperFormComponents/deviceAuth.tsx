import ReportIcon from '@mui/icons-material/Report';
import { IconButton, Tooltip } from '@mui/material';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import React, { useEffect, useRef } from 'react';

import success from '../../../../../assets/icons/generic/success.png';
import CustomButton from '../../../../../designSystem/designComponents/buttons/button';
import AvatarIcon from '../../../../../designSystem/designComponents/icons/AvatarIcon';
import Icon from '../../../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../../../designSystem/iconGroups/errorExclamation';
import { useDeviceAuth } from '../../../../../store/hooks/flows';
import {
  DeviceConnectionState,
  FeedbackState,
  useConnection,
  useFeedback
} from '../../../../../store/provider';
import Analytics from '../../../../../utils/analytics';
import { hexToVersion, inTestApp } from '../../../../../utils/compareVersion';
import logger from '../../../../../utils/logger';
import DynamicTextView from '../../../../mainApp/sidebar/settings/tabViews/deviceHealth/dynamicTextView';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'DeviceSetupAuth';

const classes = {
  middle: `${PREFIX}-middle`,
  success: `${PREFIX}-success`,
  bottomContainer: `${PREFIX}-bottomContainer`,
  report: `${PREFIX}-report`,
  btnContainer: `${PREFIX}-btnContainer`
};

const Root = styled(Grid)(() => ({
  [`& .${classes.middle}`]: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '60vh',
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  [`& .${classes.success}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  [`& .${classes.bottomContainer}`]: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  [`& .${classes.report}`]: {
    position: 'absolute',
    right: 20,
    bottom: 20
  },
  [`& .${classes.btnContainer}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }
}));

const DeviceAuthentication: React.FC<StepComponentProps> = ({ handleNext }) => {
  const {
    internalDeviceConnection: deviceConnection,
    deviceSdkVersion,
    inBackgroundProcess,
    inBootloader,
    firmwareVersion,
    deviceState,
    setDeviceSerial,
    deviceConnectionState,
    setIsInFlow
  } = useConnection();
  const latestDeviceConnection = useRef<any>();

  useEffect(() => {
    latestDeviceConnection.current = deviceConnection;
  }, [deviceConnection]);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [initialStart, setInitialStart] = React.useState(false);

  const {
    handleDeviceAuth,
    verified,
    resetHooks,
    completed,
    errorObj,
    confirmed,
    clearErrorObj
  } = useDeviceAuth(true);

  const feedback = useFeedback();

  useEffect(() => {
    Analytics.Instance.event(
      Analytics.Categories.INITIAL_DEVICE_AUTH,
      Analytics.Actions.OPEN
    );
    logger.info('Initial device auth opened');

    return () => {
      Analytics.Instance.event(
        Analytics.Categories.INITIAL_DEVICE_AUTH,
        Analytics.Actions.CLOSED
      );
      logger.info('Initial device auth closed');
    };
  }, []);

  useEffect(() => {
    if (!initialStart) {
      if (
        deviceConnection &&
        !inBackgroundProcess &&
        [
          DeviceConnectionState.IN_TEST_APP,
          DeviceConnectionState.IN_BOOTLOADER
        ].includes(deviceConnectionState)
      ) {
        if (inBootloader) {
          setErrorMsg(
            'Your device is misconfigured, Please restart cySync App. If the problem persists, please contact us.'
          );
          return;
        }

        setInitialStart(true);
        if (firmwareVersion) {
          handleDeviceAuth({
            connection: deviceConnection,
            sdkVersion: deviceSdkVersion,
            setIsInFlow,
            firmwareVersion: hexToVersion(firmwareVersion),
            setDeviceSerial,
            inTestApp: inTestApp(deviceState)
          });
        }
      }
    }
  }, [deviceConnection, inBackgroundProcess]);

  useEffect(() => {
    if (completed && verified === 2) {
      // Delay for the device upgrade
      setTimeout(() => {
        handleNext();
        resetHooks();
      }, 1500);
      Analytics.Instance.event(
        Analytics.Categories.INITIAL_DEVICE_AUTH,
        Analytics.Actions.COMPLETED
      );
    }

    if (verified === -1 || errorObj.isSet) {
      Analytics.Instance.event(
        Analytics.Categories.INITIAL_DEVICE_AUTH,
        Analytics.Actions.ERROR
      );
    }
  }, [verified, completed]);

  const newFeedbackState: FeedbackState = {
    attachLogs: true,
    attachDeviceLogs: false,
    categories: ['Report'],
    category: 'Report',
    description: errorMsg || errorObj?.getMessage(),
    descriptionError: '',
    email: '',
    emailError: '',
    subject: `Reporting for Error ${errorObj.getCode()} (Device Authentication)`,
    subjectError: ''
  };

  const handleFeedbackOpen = () => {
    feedback.showFeedback({
      isContact: true,
      heading: 'Report',
      initFeedbackState: newFeedbackState
    });
  };

  const timeout = React.useRef<NodeJS.Timeout | undefined>(undefined);
  const onRetry = () => {
    setErrorMsg('');
    clearErrorObj();
    resetHooks();

    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = undefined;
    }

    if (deviceConnectionState !== DeviceConnectionState.IN_TEST_APP) {
      setErrorMsg('Please connect the device and try again.');
      return;
    }

    timeout.current = setTimeout(() => {
      if (deviceConnection && firmwareVersion) {
        handleDeviceAuth({
          connection: deviceConnection,
          sdkVersion: deviceSdkVersion,
          setIsInFlow,
          firmwareVersion: hexToVersion(firmwareVersion),
          setDeviceSerial,
          inTestApp: inTestApp(deviceState)
        });
      }
    }, 1000);
  };

  return (
    <Root container>
      <Grid item xs={3} />
      <Grid item xs={6} className={classes.middle}>
        <Typography
          color="textSecondary"
          gutterBottom
          style={{ marginBottom: '1rem' }}
        >
          Follow the Steps on Device
        </Typography>
        <DynamicTextView
          text="Connect X1 wallet"
          state={
            deviceConnectionState === DeviceConnectionState.IN_TEST_APP ? 2 : 1
          }
        />
        <br />
        <DynamicTextView
          text="Authenticating Device"
          state={
            errorObj.isSet || errorMsg ? -1 : confirmed === 1 ? 1 : verified
          }
        />
        <br />
        {verified === 2 && (
          <div className={classes.success}>
            <AvatarIcon alt="success" src={success} size="small" />
            <Typography variant="body2" color="secondary">
              Device was verified successfully
            </Typography>
          </div>
        )}
        {(verified === -1 || errorObj.isSet || errorMsg) && (
          <div className={classes.bottomContainer}>
            <div className={classes.success}>
              <Icon
                size={50}
                viewBox="0 0 60 60"
                iconGroup={<ErrorExclamation />}
              />
              <Typography variant="body2" color="secondary">
                {errorObj.getMessage() ||
                  errorMsg ||
                  'Device Authenticating failed'}
              </Typography>
            </div>
            <div className={classes.btnContainer}>
              {verified !== -1 &&
                (!latestDeviceConnection.current ? (
                  <Tooltip
                    title={'Reconnect the device to retry'}
                    placement="top"
                  >
                    <div>
                      <CustomButton
                        style={{ margin: '1rem 10px 1rem 0' }}
                        disabled
                      >
                        Retry
                      </CustomButton>
                    </div>
                  </Tooltip>
                ) : (
                  <CustomButton
                    onClick={onRetry}
                    style={{ margin: '1rem 10px 1rem 0' }}
                  >
                    Retry
                  </CustomButton>
                ))}
              <CustomButton
                onClick={() => {
                  feedback.showFeedback({ isContact: true });
                }}
                style={{ margin: '1rem 0rem' }}
              >
                Contact Us
              </CustomButton>
            </div>
          </div>
        )}
      </Grid>
      <Grid item xs={3} />
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

DeviceAuthentication.propTypes = StepComponentPropTypes;

export default DeviceAuthentication;
