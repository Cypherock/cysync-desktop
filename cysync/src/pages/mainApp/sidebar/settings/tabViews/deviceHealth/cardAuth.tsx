import { Grid } from '@material-ui/core';
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
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

import success from '../../../../../../assets/icons/generic/success.png';
import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import IconButton from '../../../../../../designSystem/designComponents/buttons/customIconButton';
import AvatarIcon from '../../../../../../designSystem/designComponents/icons/AvatarIcon';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import ICONS from '../../../../../../designSystem/iconGroups/iconConstants';
import { useCardAuth } from '../../../../../../store/hooks/flows';
import {
  FeedbackState,
  useConnection,
  useFeedback
} from '../../../../../../store/provider';
import Analytics from '../../../../../../utils/analytics';
import logger from '../../../../../../utils/logger';

import Authentication from './cardAuthFormComponents/authentication';
import Device from './cardAuthFormComponents/device';
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
    error: {
      color: 'red'
    },
    errorButtons: {
      display: 'flex',
      justifyContent: 'space-evenly',
      width: '100%'
    },
    errorWrapper: {
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

const CardAuth: React.FC<DeviceSettingItemProps> = ({
  handleDeviceHealthTabClose
}) => {
  const classes = useStyles();

  const [activeStep, setActiveStep] = useState(0);

  const {
    errorMessage,
    handleCardAuth,
    verified,
    requestStatus,
    resetHooks,
    setErrorMessage,
    cancelCardAuth,
    completed
  } = useCardAuth();

  const handleRetry = () => {
    setErrorMessage('');
    resetHooks();
    setActiveStep(0);
  };

  const stepLen = 2;

  const { deviceConnection, connected } = useConnection();
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
      Analytics.Categories.CARD_AUTH,
      Analytics.Actions.OPEN
    );
    logger.info('Settings Card auth form open');

    return () => {
      Analytics.Instance.event(
        Analytics.Categories.CARD_AUTH,
        Analytics.Actions.CLOSED
      );
      logger.info('Settings Card auth form closed');
      if (!latestCompleted.current && latestDeviceConnection.current) {
        cancelCardAuth(latestDeviceConnection.current);
      }
    };
  }, []);

  const handleNext = () => {
    if (stepLen > activeStep) {
      setActiveStep(prevActiveStep => prevActiveStep + 1);
    } else {
      setActiveStep(0);
    }
  };

  const steps = [
    {
      name: 'Device',
      element: (
        <Device
          handleNext={handleNext}
          handleCardAuth={handleCardAuth}
          requestStatus={requestStatus}
        />
      )
    },
    {
      name: 'Authentication',
      element: (
        <Authentication verified={verified} errorMessage={errorMessage} />
      )
    }
  ];

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
    subject: 'Reporting for Error (X1 Card Authentication)',
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
          X1 Card Authentication
        </Typography>
        <IconButton onClick={handleDeviceHealthTabClose} title="Close">
          <Icon size={16} viewBox="0 0 14 14" icon={ICONS.close} color="red" />
        </IconButton>
      </Grid>
      {verified === 2 && activeStep === 1 ? (
        <Grid
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            width: '100%',
            height: '100%'
          }}
        >
          <AvatarIcon src={success} alt="success" />
          <Typography
            color="secondary"
            align="center"
            variant="h5"
            style={{ margin: '1rem 0rem 6rem' }}
          >
            X1 Card Authentication Successful
          </Typography>
          <CustomButton
            onClick={handleDeviceHealthTabClose}
            style={{ padding: '0.5rem 2rem' }}
          >
            Ok
          </CustomButton>
        </Grid>
      ) : errorMessage ? (
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
            X1 Card Authentication Failed
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

CardAuth.propTypes = DeviceSettingItemPropTypes;

export default CardAuth;
