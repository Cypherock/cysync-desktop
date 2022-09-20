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
  useConnection
} from '../../../../../store/provider';
import Analytics from '../../../../../utils/analytics';
import { hexToVersion, inTestApp } from '../../../../../utils/compareVersion';
import logger from '../../../../../utils/logger';
import DynamicTextView from '../../../../mainApp/sidebar/settings/tabViews/deviceHealth/dynamicTextView';

import {
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'InitialFlowDeviceAuth';

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

const DeviceAuthentication: React.FC<StepComponentProps> = ({
  handleNext,
  handleClose
}) => {
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
    enableRetry,
    handleFeedbackOpen,
    clearErrorObj
  } = useDeviceAuth(true);

  useEffect(() => {
    Analytics.Instance.event(
      Analytics.EVENTS.DEVICE_CONNECTION.INITIAL_FLOW_IN_MAIN.CARD_AUTH.OPENED
    );
    logger.info('Initial device auth in main opened');

    return () => {
      Analytics.Instance.event(
        Analytics.EVENTS.DEVICE_CONNECTION.INITIAL_FLOW_IN_MAIN.CARD_AUTH.CLOSED
      );
      logger.info('Initial device auth in main closed');
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
            'Your device is misconfigured, Restart cySync App. If the problem persists, contact us.'
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
        Analytics.EVENTS.DEVICE_CONNECTION.INITIAL_FLOW_IN_MAIN.DEVICE_AUTH
          .SUCCESS
      );
    }

    if (verified === -1 || errorObj.isSet) {
      if (verified === -1) {
        Analytics.Instance.event(
          Analytics.EVENTS.DEVICE_CONNECTION.INITIAL_FLOW_IN_MAIN.DEVICE_AUTH
            .COMPROMISED,
          {
            errorCode: errorObj.getCode(),
            errorMessage: errorObj.getMessage()
          }
        );
      } else {
        Analytics.Instance.event(
          Analytics.EVENTS.DEVICE_CONNECTION.INITIAL_FLOW_IN_MAIN.DEVICE_AUTH
            .ERROR,
          {
            errorCode: errorObj.getCode(),
            errorMessage: errorObj.getMessage()
          }
        );
      }
    }
  }, [verified, completed]);

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
      setErrorMsg('Connect the device and try again.');
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
          state={latestDeviceConnection.current ? 2 : 1}
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
              <CustomButton
                onClick={() => {
                  handleClose();
                }}
                style={{ margin: '1rem 10px 1rem 0' }}
              >
                Close
              </CustomButton>
              {verified !== -1 &&
                (!enableRetry ? (
                  <Tooltip title={errorObj.getActionMessage()} placement="top">
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
                onClick={handleFeedbackOpen}
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
