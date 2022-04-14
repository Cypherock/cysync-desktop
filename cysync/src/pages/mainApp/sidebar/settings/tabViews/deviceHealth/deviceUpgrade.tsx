import { stmFirmware as firmwareServer } from '@cypherock/server-wrapper';
import { Button, Grid } from '@material-ui/core';
import Step from '@material-ui/core/Step';
import StepConnector from '@material-ui/core/StepConnector';
import StepLabel from '@material-ui/core/StepLabel';
import Stepper from '@material-ui/core/Stepper';
import {
  createStyles,
  makeStyles,
  Theme,
  withStyles
} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import AlertIcon from '@material-ui/icons/ReportProblemOutlined';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

import success from '../../../../../../assets/icons/generic/success.png';
import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import IconButton from '../../../../../../designSystem/designComponents/buttons/customIconButton';
import AvatarIcon from '../../../../../../designSystem/designComponents/icons/AvatarIcon';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import ICONS from '../../../../../../designSystem/iconGroups/iconConstants';
import { useDeviceUpgrade } from '../../../../../../store/hooks/flows';
import {
  FeedbackState,
  useConnection,
  useFeedback
} from '../../../../../../store/provider';
import Analytics from '../../../../../../utils/analytics';
import {
  compareVersion,
  hexToVersion,
  inTestApp
} from '../../../../../../utils/compareVersion';
import logger from '../../../../../../utils/logger';

import Authentication from './deviceUpgradeFormComponents/authentication';
import Device from './deviceUpgradeFormComponents/device';
import { DeviceSettingItemProps, DeviceSettingItemPropTypes } from './props';

const QontoConnector = withStyles((theme: Theme) =>
  createStyles({
    alternativeLabel: {
      top: 10,
      left: 'calc(-50% + 16px)',
      right: 'calc(50% + 16px)'
    },
    active: {
      '& $line': {
        borderColor: theme.palette.secondary.main
      }
    },
    completed: {
      '& $line': {
        borderColor: theme.palette.secondary.main
      }
    },
    line: {
      borderColor: '#rgba(255,255,255,0.6)',
      borderTopWidth: 1,
      borderRadius: 1
    }
  })
)(StepConnector);

const useQontoStepIconStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      color: '#eaeaf0',
      display: 'flex',
      height: 22,
      alignItems: 'center'
    },
    active: {
      color: theme.palette.secondary.main
    },
    outerCircle: {
      border: `1px solid ${theme.palette.secondary.main}`,
      padding: 4,
      borderRadius: '50%'
    },
    notActiveCircle: {
      border: `1px solid #ccc`
    },
    circle: {
      width: 20,
      height: 20,
      borderRadius: '50%',
      backgroundColor: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    activeCircle: {
      background: theme.palette.secondary.main
    },
    completed: {
      color: theme.palette.secondary.light,
      zIndex: 1,
      fontSize: 28
    },
    text: {},
    activeText: {
      color: theme.palette.primary.main
    }
  })
);

type Props = {
  active?: boolean | undefined;
  completed?: boolean | undefined;
  icon?: JSX.Element;
};

const QontoStepIcon: React.FC<Props> = ({ active, completed, icon }) => {
  const classes = useQontoStepIconStyles();
  return (
    <div
      className={clsx(classes.root, {
        [classes.active]: active
      })}
    >
      {completed ? (
        <CheckCircleIcon className={classes.completed} />
      ) : (
        <div
          className={clsx(classes.outerCircle, {
            [classes.notActiveCircle]: !active
          })}
        >
          <div
            className={clsx(classes.circle, {
              [classes.activeCircle]: active
            })}
          >
            <span
              className={clsx(classes.text, { [classes.activeText]: active })}
            >
              {icon}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

QontoStepIcon.propTypes = {
  active: PropTypes.bool,
  completed: PropTypes.bool,
  icon: PropTypes.element
};

QontoStepIcon.defaultProps = {
  active: undefined,
  completed: undefined,
  icon: undefined
};

const StyledStepLabel = withStyles((theme: Theme) =>
  createStyles({
    label: {
      color: '#ccc'
    },
    active: {
      color: `${theme.palette.secondary.main} !important`
    },
    completed: {
      color: `${theme.palette.secondary.light} !important`
    }
  })
)(StepLabel);

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {},
    header: {
      maxHeight: '3rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    formWrapper: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    },
    stepRoot: {
      padding: 20,
      paddingLeft: 50,
      paddingRight: 50
    },
    stepperRoot: {
      background: 'rgba(0,0,0,0)',
      width: '90%'
    },
    stepLabel: {
      color: theme.palette.primary.light
    },
    content: {
      width: '50%'
    },
    flexCenter: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    primaryColor: {
      color: theme.palette.secondary.dark
    },
    flex: {
      display: 'flex',
      flexDirection: 'row'
    },
    error: {
      color: theme.palette.error.main
    },
    success: {
      display: 'flex',
      alignItems: 'center'
    },
    errorButtons: {
      display: 'flex',
      justifyContent: 'space-evenly',
      width: '100%'
    },
    rootCenter: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    },
    center: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%'
    }
  })
);

const DeviceAuth: React.FC<DeviceSettingItemProps> = ({
  handleDeviceHealthTabClose,
  allowExit,
  setAllowExit
}) => {
  const classes = useStyles();

  const [authState, setAuthState] = React.useState<-1 | 0 | 1 | 2>(0);
  const [connStatus, setConnStatus] = React.useState<-1 | 0 | 1 | 2>(1);
  const [upgradeAvailable, setUpgradeAvailable] = React.useState(false);
  const [initialStart, setInitialStart] = React.useState(false);

  const { connected } = useConnection();

  const {
    startDeviceUpdate,
    cancelDeviceUpgrade,
    handleRetry,
    deviceConnection,
    firmwareVersion,
    deviceState,
    inBackgroundProcess,
    isCompleted,
    setIsCompleted,
    displayErrorMessage,
    setDisplayErrorMessage,
    setIsDeviceUpdating,
    isApproved,
    isInternetSlow,
    updateDownloaded,
    errorMessage,
    latestVersion,
    setLatestVersion
  } = useDeviceUpgrade();

  const latestDeviceConnection = useRef<any>();
  const latestCompleted = useRef<boolean>();

  useEffect(() => {
    latestDeviceConnection.current = deviceConnection;
  }, [deviceConnection]);

  useEffect(() => {
    latestCompleted.current = isCompleted === 2;
  }, [isCompleted]);

  useEffect(() => {
    Analytics.Instance.event(
      Analytics.Categories.DEVICE_UPDATE,
      Analytics.Actions.OPEN
    );
    logger.info('Setting device update open');
    setIsDeviceUpdating(true);

    return () => {
      setAllowExit(true);
      setIsDeviceUpdating(false);
      if (!latestCompleted.current && latestDeviceConnection.current) {
        cancelDeviceUpgrade(latestDeviceConnection.current);
      }
      logger.info('Setting device update closed');
      Analytics.Instance.event(
        Analytics.Categories.DEVICE_UPDATE,
        Analytics.Actions.CLOSED
      );
    };
  }, []);

  useEffect(() => {
    if (deviceConnection && !inBackgroundProcess && !initialStart) {
      setInitialStart(true);
      setConnStatus(2);
      setAuthState(1);
    } else {
      setConnStatus(1);
    }
  }, [deviceConnection, inBackgroundProcess]);

  useEffect(() => {
    if (authState === 1) {
      firmwareServer
        .getLatest()
        .then(response => {
          if (
            (firmwareVersion &&
              deviceState &&
              compareVersion(
                response.data.firmware.version,
                hexToVersion(firmwareVersion)
              )) ||
            inTestApp(deviceState)
          ) {
            setUpgradeAvailable(true);
            setLatestVersion(response.data.firmware.version);
          }

          if (process.env.BUILD_TYPE === 'debug') {
            setUpgradeAvailable(true);
            setLatestVersion(response.data.firmware.version);
          }

          setAuthState(2);
          return null;
        })
        .catch(error => {
          logger.error(error);
          setIsCompleted(-1);
          setAuthState(-1);
          setDisplayErrorMessage(
            'Cannot connect to the server. Please check your internet connection and try again.'
          );
        });
    }
  }, [authState]);

  useEffect(() => {
    if (isCompleted === 1 && isApproved === 2) {
      setAllowExit(false);
    } else {
      setAllowExit(true);
    }
  }, [isCompleted, isApproved]);

  const [activeStep, setActiveStep] = React.useState(0);

  const handleNext = () => {
    if (activeStep <= 2) {
      setActiveStep(prevActiveStep => prevActiveStep + 1);
    } else {
      setActiveStep(0);
    }
  };

  const steps = [
    {
      name: 'Device Connection',
      element: <Device connStatus={connStatus} authState={authState} />
    },
    {
      name: 'Upgrade',
      element: (
        <Authentication
          isCompleted={isCompleted}
          isApproved={isApproved}
          isInternetSlow={isInternetSlow}
          updateDownloaded={updateDownloaded}
          latestVersion={latestVersion}
        />
      )
    }
  ];

  useEffect(() => {
    if (activeStep === 1) {
      startDeviceUpdate();
    }
  }, [activeStep]);

  useEffect(() => {
    if (isCompleted === -1) {
      Analytics.Instance.event(
        Analytics.Categories.DEVICE_UPDATE,
        Analytics.Actions.ERROR
      );
    } else if (isCompleted === 2) {
      Analytics.Instance.event(
        Analytics.Categories.DEVICE_UPDATE,
        Analytics.Actions.COMPLETED
      );
    }
  }, [isCompleted]);

  const handleOnRetry = () => {
    handleRetry();
  };

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
    <Grid container style={{ padding: '0.5rem 0rem' }}>
      <Grid item xs={12} className={classes.header}>
        <Typography color="secondary" variant="h5">
          Device Upgrade
        </Typography>
        {allowExit && (
          <IconButton onClick={handleDeviceHealthTabClose} title="Close">
            <Icon
              size={16}
              viewBox="0 0 14 14"
              icon={ICONS.close}
              color="red"
            />
          </IconButton>
        )}
      </Grid>
      {isCompleted === 2 ? (
        <Grid item xs={12} className={classes.rootCenter}>
          <AvatarIcon src={success} alt="success" />
          <Typography
            color="secondary"
            align="center"
            variant="h5"
            style={{ margin: '1rem 0rem 6rem' }}
          >
            Device Upgrade Successful
          </Typography>
          <Button
            color="secondary"
            onClick={handleDeviceHealthTabClose}
            variant="contained"
          >
            Ok
          </Button>
        </Grid>
      ) : authState === 2 && activeStep === 0 ? (
        <Grid
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            paddingTop: '5%'
          }}
        >
          <AvatarIcon src={success} alt="success" />
          <Typography
            color="secondary"
            align="center"
            variant="h5"
            style={{ margin: '0rem 0rem' }}
          >
            {upgradeAvailable
              ? 'Device Update is Available'
              : "Your X1 wallet's firmware is up to date"}
          </Typography>
          <Typography color="textPrimary" style={{ margin: '1rem 0rem' }}>
            {`Version: ${latestVersion}`}
          </Typography>
          {upgradeAvailable && (
            <CustomButton
              onClick={handleNext}
              style={{ padding: '0.5rem 2rem' }}
            >
              Update
            </CustomButton>
          )}
          {upgradeAvailable || (
            <CustomButton
              onClick={handleDeviceHealthTabClose}
              style={{ padding: '0.5rem 2rem' }}
            >
              Close
            </CustomButton>
          )}
        </Grid>
      ) : isCompleted === -1 ? (
        <Grid
          item
          container
          xs={12}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            width: '100%',
            height: '100%'
          }}
        >
          <Icon
            size={100}
            viewBox=" 0 0 55 55"
            iconGroup={<ErrorExclamation />}
          />
          <Typography
            className={classes.error}
            align="center"
            variant="h5"
            style={{ margin: '1rem 0rem 0rem' }}
          >
            Device Upgrade Failed
          </Typography>
          <Typography
            color="textSecondary"
            style={{ margin: '1rem 0rem 6rem' }}
          >
            {displayErrorMessage}
          </Typography>
          <div className={classes.errorButtons}>
            <CustomButton
              variant="outlined"
              color="default"
              onClick={handleOnRetry}
              style={{ textTransform: 'none', padding: '0.5rem 2rem' }}
            >
              Retry
            </CustomButton>
            <CustomButton
              color="primary"
              onClick={handleFeedbackOpen}
              style={{ padding: '0.5rem 2rem' }}
            >
              Report
            </CustomButton>
          </div>
        </Grid>
      ) : (
        <Grid container className={classes.formWrapper}>
          <Stepper
            alternativeLabel
            activeStep={activeStep}
            className={classes.stepperRoot}
            connector={<QontoConnector />}
          >
            {steps.map(step => (
              <Step key={step.name}>
                <StyledStepLabel
                  StepIconComponent={QontoStepIcon}
                  className={classes.stepLabel}
                >
                  {step.name}
                </StyledStepLabel>
              </Step>
            ))}
          </Stepper>
          <div className={classes.content}>{steps[activeStep].element}</div>
          <div className={classes.flexCenter} style={{ marginTop: '15px' }}>
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
        </Grid>
      )}
    </Grid>
  );
};

DeviceAuth.propTypes = DeviceSettingItemPropTypes;

export default DeviceAuth;
