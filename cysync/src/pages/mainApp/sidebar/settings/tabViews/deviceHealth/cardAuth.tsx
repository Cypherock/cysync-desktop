import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Grid, Tooltip } from '@mui/material';
import Step from '@mui/material/Step';
import StepConnector from '@mui/material/StepConnector';
import { StepIconProps } from '@mui/material/StepIcon';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import { styled, Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';
import clsx from 'clsx';
import React, { useEffect, useRef, useState } from 'react';

import success from '../../../../../../assets/icons/generic/success.png';
import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import AvatarIcon from '../../../../../../designSystem/designComponents/icons/AvatarIcon';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import { useCardAuth } from '../../../../../../store/hooks/flows';
import { useConnection } from '../../../../../../store/provider';
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

const STEP_PREFIX = 'SettingsCardAuth-Step';

const stepClasses = {
  active: `${STEP_PREFIX}-active`,
  outerCircle: `${STEP_PREFIX}-outerCircle`,
  notActiveCircle: `${STEP_PREFIX}-notActiveCircle`,
  circle: `${STEP_PREFIX}-circle`,
  activeCircle: `${STEP_PREFIX}-activeCircle`,
  completed: `${STEP_PREFIX}-completed`,
  activeText: `${STEP_PREFIX}-activeText`
};

const StepRoot = styled('div')(({ theme }) => ({
  color: '#eaeaf0',
  display: 'flex',
  height: 22,
  alignItems: 'center',
  [`& .${stepClasses.active}`]: {
    color: theme.palette.secondary.main
  },
  [`& .${stepClasses.outerCircle}`]: {
    border: `1px solid ${theme.palette.secondary.main}`,
    padding: 4,
    borderRadius: '50%'
  },
  [`& .${stepClasses.notActiveCircle}`]: {
    border: `1px solid #ccc`
  },
  [`& .${stepClasses.circle}`]: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    backgroundColor: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  [`& .${stepClasses.activeCircle}`]: {
    background: theme.palette.secondary.main
  },
  [`& .${stepClasses.completed}`]: {
    color: theme.palette.secondary.light,
    zIndex: 1,
    fontSize: 28
  },
  [`& .${stepClasses.activeText}`]: {
    color: theme.palette.primary.main
  }
}));

const QontoStepIcon: React.FC<StepIconProps> = ({
  active,
  completed,
  icon
}) => {
  return (
    <StepRoot
      className={clsx({
        [stepClasses.active]: active
      })}
    >
      {completed ? (
        <CheckCircleIcon className={stepClasses.completed} />
      ) : (
        <div
          className={clsx(stepClasses.outerCircle, {
            [stepClasses.notActiveCircle]: !active
          })}
        >
          <div
            className={clsx(stepClasses.circle, {
              [stepClasses.activeCircle]: active
            })}
          >
            <span
              className={clsx({
                [stepClasses.activeText]: active
              })}
            >
              {icon}
            </span>
          </div>
        </div>
      )}
    </StepRoot>
  );
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

const PREFIX = 'SettingsCardAuth';

const classes = {
  header: `${PREFIX}-header`,
  formWrapper: `${PREFIX}-formWrapper`,
  stepRoot: `${PREFIX}-stepRoot`,
  stepperRoot: `${PREFIX}-stepperRoot`,
  stepLabel: `${PREFIX}-stepLabel`,
  content: `${PREFIX}-content`,
  error: `${PREFIX}-error`,
  errorButtons: `${PREFIX}-errorButtons`,
  errorWrapper: `${PREFIX}-errorWrapper`,
  center: `${PREFIX}-center`
};

const Root = styled(Grid)(({ theme }) => ({
  [`& .${classes.header}`]: {
    maxHeight: '3rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  [`& .${classes.formWrapper}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.stepRoot}`]: {
    padding: 20,
    paddingLeft: 50,
    paddingRight: 50
  },
  [`& .${classes.stepperRoot}`]: {
    background: 'rgba(0,0,0,0)',
    width: '90%'
  },
  [`& .${classes.stepLabel}`]: {
    color: theme.palette.primary.light
  },
  [`& .${classes.content}`]: {
    width: '50%'
  },
  [`& .${classes.error}`]: {
    color: 'red'
  },
  [`& .${classes.errorButtons}`]: {
    display: 'flex',
    justifyContent: 'space-evenly',
    width: '100%'
  },
  [`& .${classes.errorWrapper}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.center}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  }
}));

const CardAuth: React.FC<DeviceSettingItemProps> = ({
  handleDeviceHealthTabClose
}) => {
  const [activeStep, setActiveStep] = useState(0);

  const {
    errorObj,
    clearErrorObj,
    handleFeedbackOpen,
    handleCardAuth,
    verified,
    requestStatus,
    resetHooks,
    cancelCardAuth,
    completed
  } = useCardAuth();

  const handleRetry = () => {
    clearErrorObj();
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
      element: <Authentication verified={verified} errorObj={errorObj} />
    }
  ];

  return (
    <Root container style={{ padding: '0.5rem 0rem' }}>
      <Grid item xs={12} className={classes.header}>
        <Typography color="secondary" variant="h5">
          X1 Card Authentication
        </Typography>
      </Grid>
      {completed && verified === 2 ? (
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
      ) : errorObj.isSet ? (
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
            {errorObj.showError()}
          </Typography>
          {verified === -1 ? (
            <div className={classes.errorButtons}>
              <CustomButton
                variant="outlined"
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
              {!latestDeviceConnection.current ? (
                <Tooltip
                  title={'Reconnect the device to retry'}
                  placement="top"
                >
                  <div>
                    <CustomButton
                      variant="outlined"
                      style={{ textTransform: 'none', padding: '0.5rem 2rem' }}
                      disabled
                    >
                      Retry
                    </CustomButton>
                  </div>
                </Tooltip>
              ) : (
                <CustomButton
                  variant="outlined"
                  onClick={handleRetry}
                  style={{ textTransform: 'none', padding: '0.5rem 2rem' }}
                >
                  Retry
                </CustomButton>
              )}
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
            {steps.map((data, step) => (
              <Step
                key={data.name}
                completed={
                  step === steps.length - 1 ? verified === 2 : step < activeStep
                }
              >
                <StyledStepLabel
                  StepIconComponent={QontoStepIcon}
                  className={classes.stepLabel}
                >
                  {data.name}
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
    </Root>
  );
};

CardAuth.propTypes = DeviceSettingItemPropTypes;

export default CardAuth;
