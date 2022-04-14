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
import { useDeviceAuth } from '../../../../../../store/hooks/flows';
import {
  FeedbackState,
  useConnection,
  useFeedback
} from '../../../../../../store/provider';
import Analytics from '../../../../../../utils/analytics';
import logger from '../../../../../../utils/logger';

import Authentication from './deviceAuthFormComponents/authentication';
import Device from './deviceAuthFormComponents/device';
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
    success: {
      display: 'flex',
      alignItems: 'center'
    },
    rootCenter: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    },
    error: {
      color: 'red'
    },
    errorButtons: {
      display: 'flex',
      justifyContent: 'space-evenly',
      width: '100%'
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
  handleDeviceHealthTabClose
}) => {
  const classes = useStyles();

  const [connStatus, setConnStatus] = React.useState<-1 | 0 | 1 | 2>(1);

  const { deviceConnection, connected } = useConnection();

  const {
    handleDeviceAuth,
    completed,
    verified,
    resetHooks,
    errorMessage,
    cancelDeviceAuth,
    setErrorMessage,
    confirmed
  } = useDeviceAuth();

  const latestDeviceConnection = useRef<any>();
  const latestCompleted = useRef<boolean>();

  useEffect(() => {
    latestDeviceConnection.current = deviceConnection;
  }, [deviceConnection]);

  useEffect(() => {
    latestCompleted.current = completed;
  }, [completed]);

  useEffect(() => {
    Analytics.Instance.event(
      Analytics.Categories.DEVICE_AUTH,
      Analytics.Actions.OPEN
    );
    logger.info('Setting device authentication open');

    return () => {
      Analytics.Instance.event(
        Analytics.Categories.DEVICE_AUTH,
        Analytics.Actions.CLOSED
      );
      logger.info('Setting device authentication closed');
      if (!latestCompleted.current && latestDeviceConnection.current) {
        cancelDeviceAuth(latestDeviceConnection.current);
      }
    };
  }, []);

  const [activeStep, setActiveStep] = React.useState(0);
  const [isCompleted, setCompleted] = React.useState<-1 | 0 | 1 | 2>(0);

  useEffect(() => {
    if (deviceConnection) {
      setConnStatus(2);
      setTimeout(() => {
        if (activeStep !== 1) {
          setActiveStep(1);
        }
      }, 1000);
    } else {
      setConnStatus(1);
    }
  }, [deviceConnection]);

  const steps = [
    {
      name: 'Device Connection',
      element: <Device connStatus={connStatus} />
    },
    {
      name: 'Authentication',
      element: (
        <Authentication
          isCompleted={isCompleted}
          setCompleted={setCompleted}
          errorMessage={errorMessage}
          handleDeviceAuth={handleDeviceAuth}
          completed={completed}
          verified={verified}
          resetHooks={resetHooks}
          cancelDeviceAuth={cancelDeviceAuth}
          confirmed={confirmed}
        />
      )
    }
  ];

  const handleRetry = () => {
    logger.info('Device authentication retry');
    setErrorMessage('');
    setCompleted(0);
    resetHooks();
    if (deviceConnection) {
      setActiveStep(1);
    } else {
      setActiveStep(0);
    }
  };

  const { showFeedback } = useFeedback();

  const newFeedbackState: FeedbackState = {
    attachLogs: true,
    attachDeviceLogs: false,
    categories: ['Report'],
    category: 'Report',
    description: errorMessage,
    descriptionError: '',
    email: '',
    emailError: '',
    subject: 'Reporting for Error (Authenticating Device)',
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
          Device Authentication
        </Typography>
        <IconButton onClick={handleDeviceHealthTabClose} title="Close">
          <Icon size={16} viewBox="0 0 14 14" icon={ICONS.close} color="red" />
        </IconButton>
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
            Device Authentication Successful
          </Typography>
          <Button
            color="secondary"
            onClick={handleDeviceHealthTabClose}
            variant="contained"
          >
            Ok
          </Button>
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
            Device Authentication Failed
          </Typography>
          <Typography
            color="textSecondary"
            style={{ margin: '1rem 0rem 6rem' }}
          >
            {errorMessage}
          </Typography>
          {verified === -1 ? (
            <div className={classes.errorButtons}>
              <CustomButton
                variant="outlined"
                color="default"
                onClick={handleDeviceHealthTabClose}
                style={{ textTransform: 'none', padding: '0.5rem 2rem' }}
              >
                Cancel
              </CustomButton>
              <CustomButton
                color="primary"
                onClick={handleFeedbackOpen}
                style={{ padding: '0.5rem 2rem' }}
              >
                Contact Us
              </CustomButton>
            </div>
          ) : (
            <div className={classes.errorButtons}>
              <CustomButton
                variant="outlined"
                color="default"
                onClick={handleRetry}
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
          )}
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
              Do not disconnect the device while it is being authenticated.
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
