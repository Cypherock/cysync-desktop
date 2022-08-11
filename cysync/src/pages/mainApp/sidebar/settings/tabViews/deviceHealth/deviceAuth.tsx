import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AlertIcon from '@mui/icons-material/ReportProblemOutlined';
import { Button, Grid } from '@mui/material';
import Step from '@mui/material/Step';
import StepConnector from '@mui/material/StepConnector';
import { StepIconProps } from '@mui/material/StepIcon';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import { styled, Theme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';
import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import success from '../../../../../../assets/icons/generic/success.png';
import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import IconButton from '../../../../../../designSystem/designComponents/buttons/customIconButton';
import AvatarIcon from '../../../../../../designSystem/designComponents/icons/AvatarIcon';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import ICONS from '../../../../../../designSystem/iconGroups/iconConstants';
import { useDeviceAuth } from '../../../../../../store/hooks/flows';
import { useConnection } from '../../../../../../store/provider';
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

const STEP_PREFIX = 'SettingsDeviceAuth-Step';

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

const PREFIX = 'SettingsDeviceAuth';

const classes = {
  header: `${PREFIX}-header`,
  formWrapper: `${PREFIX}-formWrapper`,
  stepRoot: `${PREFIX}-stepRoot`,
  stepperRoot: `${PREFIX}-stepperRoot`,
  stepLabel: `${PREFIX}-stepLabel`,
  content: `${PREFIX}-content`,
  flexCenter: `${PREFIX}-flexCenter`,
  primaryColor: `${PREFIX}-primaryColor`,
  flex: `${PREFIX}-flex`,
  success: `${PREFIX}-success`,
  rootCenter: `${PREFIX}-rootCenter`,
  error: `${PREFIX}-error`,
  errorButtons: `${PREFIX}-errorButtons`,
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
  [`& .${classes.flexCenter}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.primaryColor}`]: {
    color: theme.palette.secondary.dark
  },
  [`& .${classes.flex}`]: {
    display: 'flex',
    flexDirection: 'row'
  },
  [`& .${classes.success}`]: {
    display: 'flex',
    alignItems: 'center'
  },
  [`& .${classes.rootCenter}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  [`& .${classes.error}`]: {
    color: 'red'
  },
  [`& .${classes.errorButtons}`]: {
    display: 'flex',
    justifyContent: 'space-evenly',
    width: '100%'
  },
  [`& .${classes.center}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  }
}));

const DeviceAuth: React.FC<DeviceSettingItemProps> = ({
  handleDeviceHealthTabClose
}) => {
  const [connStatus, setConnStatus] = React.useState<-1 | 0 | 1 | 2>(1);

  const {
    internalDeviceConnection: deviceConnection,
    inBackgroundProcess,
    connected,
    retryConnection,
    setBlockConnectionPopup
  } = useConnection();

  const {
    handleDeviceAuth,
    completed,
    verified,
    resetHooks,
    errorObj,
    cancelDeviceAuth,
    clearErrorObj,
    confirmed,
    handleFeedbackOpen
  } = useDeviceAuth();

  const latestDeviceConnection = useRef<any>();
  const latestCompleted = useRef<boolean>();

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const isRefresh = Boolean(query.get('isRefresh'));

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
    if (isRefresh) {
      logger.info('Device authentication is refreshing');
      handleRetry();
    }

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
    if (deviceConnection && !inBackgroundProcess) {
      setConnStatus(2);
      setTimeout(() => {
        if (activeStep !== 1) {
          setActiveStep(1);
        }
      }, 0);
    } else {
      setConnStatus(1);
    }
  }, [deviceConnection, inBackgroundProcess]);

  useEffect(() => {
    setBlockConnectionPopup(true);

    return () => {
      setBlockConnectionPopup(false);
    };
  }, []);

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
          errorObj={errorObj}
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
    clearErrorObj();
    setCompleted(0);
    resetHooks();
    if (deviceConnection && !inBackgroundProcess) {
      setActiveStep(1);
    } else {
      setActiveStep(0);
    }
  };

  const onSuccess = () => {
    retryConnection();
    handleDeviceHealthTabClose();
  };

  return (
    <Root container style={{ padding: '0.5rem 0rem' }}>
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
          <Button color="secondary" onClick={onSuccess} variant="contained">
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
            <Typography
              color="textSecondary"
              style={{ margin: '1rem 0rem 6rem' }}
            >
              {errorObj.showError()}
            </Typography>
          </Grid>
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
                      color="primary"
                      style={{ padding: '0.5rem 2rem' }}
                      disabled
                    >
                      Retry
                    </CustomButton>
                  </div>
                </Tooltip>
              ) : (
                <CustomButton
                  color="primary"
                  onClick={handleRetry}
                  style={{ padding: '0.5rem 2rem' }}
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
    </Root>
  );
};

DeviceAuth.propTypes = DeviceSettingItemPropTypes;

export default DeviceAuth;
