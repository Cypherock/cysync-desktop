import Grid from '@material-ui/core/Grid';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import AlertIcon from '@material-ui/icons/ReportProblemOutlined';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import successImg from '../../../assets/icons/generic/success.png';
import CustomButton from '../../../designSystem/designComponents/buttons/button';
import ModAvatar from '../../../designSystem/designComponents/icons/AvatarIcon';
import Icon from '../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../designSystem/iconGroups/errorExclamation';
import { useDeviceAuth } from '../../../store/hooks/flows';
import { useConnection, useFeedback } from '../../../store/provider';
import Analytics from '../../../utils/analytics';
import { hexToVersion, inTestApp } from '../../../utils/compareVersion';
import logger from '../../../utils/logger';
import DynamicTextView from '../sidebar/settings/tabViews/deviceHealth/dynamicTextView';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      padding: '20px'
    },
    flex: {
      display: 'flex',
      flexDirection: 'row'
    },
    alignCenterCenter: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '5rem'
    },
    error: {
      color: 'red'
    },
    success: {
      display: 'flex',
      alignItems: 'center'
    },
    errorButtons: {
      display: 'flex',
      justifyContent: 'space-around',
      width: '100%'
    },
    center: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%'
    },
    rootCenter: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    },
    primaryColor: {
      color: theme.palette.secondary.dark
    }
  })
);

type Props = {
  handleClose: () => void;
};

const Authenticator: React.FC<Props> = ({ handleClose }) => {
  const classes = useStyles();

  const {
    internalDeviceConnection: deviceConnection,
    deviceSdkVersion,
    connected,
    firmwareVersion,
    deviceState,
    setDeviceSerial,
    setDeviceConnectionStatus,
    setIsInFlow
  } = useConnection();

  const { handleDeviceAuth, completed, verified, errorMessage, confirmed } =
    useDeviceAuth();

  const feedback = useFeedback();

  useEffect(() => {
    logger.info('Initiating device auth from prompt');

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

    return () => {
      logger.info('Closed device auth prompt');
      setDeviceConnectionStatus(false);
    };
  }, []);

  useEffect(() => {
    if (verified === -1 || errorMessage) {
      Analytics.Instance.event(
        Analytics.Categories.DEVICE_AUTH_PROMPT,
        Analytics.Actions.ERROR
      );
    } else if (completed && verified === 2) {
      Analytics.Instance.event(
        Analytics.Categories.DEVICE_AUTH_PROMPT,
        Analytics.Actions.COMPLETED
      );
    }
  }, [verified, completed]);

  return (
    <Grid className={classes.container} container>
      {completed && verified === 2 ? (
        <Grid container>
          <Grid item xs={1} />
          <Grid item xs={10} className={classes.alignCenterCenter}>
            <ModAvatar src={successImg} alt="success" />
            <Typography
              variant="h2"
              color="textPrimary"
              align="center"
              style={{ margin: '1rem 0rem 2rem' }}
            >
              Device Authentication successful!
            </Typography>
            <div style={{ display: 'flex' }}>
              <CustomButton
                onClick={() => handleClose()}
                style={{
                  padding: '0.5rem 3rem',
                  margin: '0.5rem',
                  color: '#FFFFFF'
                }}
              >
                Ok
              </CustomButton>
            </div>
          </Grid>
          <Grid item xs={1} />
        </Grid>
      ) : (
        <>
          <Grid item xs={12}>
            <Typography
              variant="h5"
              align="center"
              style={{ margin: 'auto', marginBottom: '15px' }}
            >
              Completing device authentication...
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              Follow the steps on the Device
            </Typography>
            <div className={classes.container}>
              <br />
              <DynamicTextView state={confirmed} text="Confirm on Device" />
              <br />
              <DynamicTextView state={verified} text="Device Authentication" />
            </div>
          </Grid>
          <div className={classes.center} style={{ margin: '15px 0' }}>
            <AlertIcon
              className={classes.primaryColor}
              style={{ marginRight: '5px' }}
            />
            <Typography variant="body2" color="textSecondary" align="center">
              Do not disconnect device while it is being authenticated. This may
              take a few seconds.
            </Typography>
          </div>
          {connected || (
            <div style={{ marginTop: '10px' }} className={classes.center}>
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
          {errorMessage ? (
            <div className={classes.center}>
              <div>
                <ListItem color="red">
                  <ListItemAvatar>
                    <Icon
                      size={40}
                      viewBox="0 0 60 60"
                      iconGroup={<ErrorExclamation />}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    className={classes.error}
                    primary={errorMessage || 'Device Auth Failed'}
                  />
                </ListItem>
                <div className={classes.errorButtons}>
                  <CustomButton
                    onClick={() => {
                      handleClose();
                    }}
                    style={{ margin: '1rem 0rem' }}
                  >
                    Close
                  </CustomButton>
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
            </div>
          ) : null}
        </>
      )}
    </Grid>
  );
};

Authenticator.propTypes = {
  handleClose: PropTypes.func.isRequired
};

export default Authenticator;
