import AlertIcon from '@mui/icons-material/ReportProblemOutlined';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import successImg from '../../../assets/icons/generic/success.png';
import CustomButton from '../../../designSystem/designComponents/buttons/button';
import ModAvatar from '../../../designSystem/designComponents/icons/AvatarIcon';
import Icon from '../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../designSystem/iconGroups/errorExclamation';
import { CyError } from '../../../errors';
import { useDeviceUpgrade } from '../../../store/hooks/flows';
import { useNetwork } from '../../../store/provider';
import Analytics from '../../../utils/analytics';
import logger from '../../../utils/logger';
import DynamicTextView from '../sidebar/settings/tabViews/deviceHealth/dynamicTextView';

const PREFIX = 'DeviceUpdater-Updater';

const classes = {
  container: `${PREFIX}-container`,
  flex: `${PREFIX}-flex`,
  alignCenterCenter: `${PREFIX}-alignCenterCenter`,
  error: `${PREFIX}-error`,
  success: `${PREFIX}success`,
  errorButtons: `${PREFIX}-errorButtons`,
  center: `${PREFIX}-center`,
  rootCenter: `${PREFIX}-rootCenter`,
  primaryColor: `${PREFIX}-primaryColor`
};

const Root = styled(Grid)(({ theme }) => ({
  [`& .${classes.container}`]: {
    padding: '20px'
  },
  [`& .${classes.flex}`]: {
    display: 'flex',
    flexDirection: 'row'
  },
  [`& .${classes.alignCenterCenter}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '5rem'
  },
  [`& .${classes.error}`]: {
    color: 'red'
  },
  [`& .${classes.success}`]: {
    display: 'flex',
    alignItems: 'center'
  },
  [`& .${classes.errorButtons}`]: {
    display: 'flex',
    justifyContent: 'space-around',
    width: '100%'
  },
  [`& .${classes.center}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  [`& .${classes.rootCenter}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.primaryColor}`]: {
    color: theme.palette.secondary.dark
  }
}));

type Props = {
  handleClose: () => void;
};

const Updater: React.FC<Props> = ({ handleClose }) => {
  const { connected } = useNetwork();

  const {
    startDeviceUpdate,
    setBlockNewConnection,
    isCompleted,
    isApproved,
    isInternetSlow,
    updateDownloaded,
    latestVersion,
    handleFeedbackOpen,
    errorObj,
    clearErrorObj
  } = useDeviceUpgrade();

  const onClose = () => {
    setBlockNewConnection(false);
    handleClose();
  };

  useEffect(() => {
    logger.info('Initiating device update from prompt');
    clearErrorObj();

    startDeviceUpdate();

    return () => {
      logger.info('Closed device update prompt');
      setBlockNewConnection(false);
    };
  }, []);

  useEffect(() => {
    if (isCompleted === -1 || errorObj.isSet) {
      Analytics.Instance.event(
        Analytics.Categories.PARTIAL_DEVICE_UPDATE,
        Analytics.Actions.ERROR
      );
    } else if (isCompleted === 2) {
      Analytics.Instance.event(
        Analytics.Categories.PARTIAL_DEVICE_UPDATE,
        Analytics.Actions.COMPLETED
      );
    }
  }, [isCompleted, errorObj]);

  return (
    <Root className={classes.container} container>
      {isCompleted === 2 ? (
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
              Device Upgrade successful!
            </Typography>
            <div style={{ display: 'flex' }}>
              <CustomButton
                onClick={onClose}
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
              Completing device update...
            </Typography>
            {isInternetSlow ? (
              <>
                <Alert severity="warning" variant="outlined">
                  Your Internet connection is slow
                </Alert>
                <br />
              </>
            ) : null}
            <Typography variant="body2" color="textSecondary" align="center">
              Follow the steps on the Device
            </Typography>
            <div className={classes.container}>
              <br />
              <DynamicTextView
                state={updateDownloaded}
                text="Downloading Firmware"
              />
              <br />
              <DynamicTextView
                state={isApproved}
                text={`Confirm update on device to version ${latestVersion}`}
              />
              <br />
              <DynamicTextView state={isCompleted} text="Updating Firmware" />
            </div>
          </Grid>
          <div className={classes.center} style={{ margin: '15px 0' }}>
            <AlertIcon
              className={classes.primaryColor}
              style={{ marginRight: '5px' }}
            />
            <Typography variant="body2" color="textSecondary" align="center">
              Do not disconnect device while it is being updated. This may take
              a few minutes.
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
          {isCompleted === -1 || errorObj.isSet ? (
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
                    primary={errorObj.showError() || 'Device Upgrade Failed'}
                  />
                </ListItem>
                <div className={classes.errorButtons}>
                  <CustomButton
                    onClick={onClose}
                    style={{ margin: '1rem 0rem' }}
                  >
                    Close
                  </CustomButton>
                  <CustomButton
                    onClick={handleFeedbackOpen}
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
    </Root>
  );
};

Updater.propTypes = {
  handleClose: PropTypes.func.isRequired
};

export default Updater;
