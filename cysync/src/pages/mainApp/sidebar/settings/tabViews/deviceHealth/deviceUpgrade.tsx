import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AlertIcon from '@mui/icons-material/ReportProblemOutlined';
import { Button, Grid } from '@mui/material';
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
import React, { useEffect, useRef } from 'react';

import success from '../../../../../../assets/icons/generic/success.png';
import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import IconButton from '../../../../../../designSystem/designComponents/buttons/customIconButton';
import AvatarIcon from '../../../../../../designSystem/designComponents/icons/AvatarIcon';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import ICONS from '../../../../../../designSystem/iconGroups/iconConstants';
import { useDeviceUpgrade } from '../../../../../../store/hooks/flows';
import { useNetwork } from '../../../../../../store/provider';
import Analytics from '../../../../../../utils/analytics';
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

const STEP_PREFIX = 'SettingsDeviceUpgrade-Step';

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
  color: theme.palette.text.primary,
  display: 'flex',
  height: 22,
  alignItems: 'center',
  [`&.${stepClasses.active}`]: {
    color: theme.palette.secondary.main
  },
  [`& .${stepClasses.outerCircle}`]: {
    border: `1px solid ${theme.palette.secondary.main}`,
    padding: 4,
    borderRadius: '50%'
  },
  [`& .${stepClasses.notActiveCircle}`]: {
    border: `1px solid ${theme.palette.text.secondary}`
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
            <span className={clsx({ [stepClasses.activeText]: active })}>
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

const PREFIX = 'SettingsDeviceUpgrade';

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
  error: `${PREFIX}-error`,
  success: `${PREFIX}-success`,
  errorButtons: `${PREFIX}-errorButtons`,
  rootCenter: `${PREFIX}-rootCenter`,
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
  [`& .${classes.error}`]: {
    color: theme.palette.error.main
  },
  [`& .${classes.success}`]: {
    display: 'flex',
    alignItems: 'center'
  },
  [`& .${classes.errorButtons}`]: {
    display: 'flex',
    justifyContent: 'space-evenly',
    width: '100%'
  },
  [`& .${classes.rootCenter}`]: {
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

const DeviceUpgrade: React.FC<DeviceSettingItemProps> = ({
  handleDeviceHealthTabClose,
  allowExit,
  setAllowExit
}) => {
  const [authState, setAuthState] = React.useState<-1 | 0 | 1 | 2>(0);
  const [connStatus, setConnStatus] = React.useState<-1 | 0 | 1 | 2>(1);
  const [initialStart, setInitialStart] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(0);

  const { connected } = useNetwork();

  const {
    startDeviceUpdate,
    cancelDeviceUpgrade,
    handleRetry,
    deviceConnection,
    inBackgroundProcess,
    isCompleted,
    setIsCompleted,
    isApproved,
    isInternetSlow,
    updateDownloaded,
    errorObj,
    handleFeedbackOpen,
    latestVersion,
    checkLatestFirmware,
    upgradeAvailable
  } = useDeviceUpgrade();

  const latestDeviceConnection = useRef<any>();
  const latestCompleted = useRef<boolean>();
  const latestStep = useRef<number>();

  useEffect(() => {
    latestDeviceConnection.current = deviceConnection;
  }, [deviceConnection]);

  useEffect(() => {
    latestCompleted.current = isCompleted === 2;
  }, [isCompleted]);

  useEffect(() => {
    latestStep.current = activeStep;
  }, [activeStep]);

  useEffect(() => {
    Analytics.Instance.event(
      Analytics.Categories.DEVICE_UPDATE,
      Analytics.Actions.OPEN
    );
    logger.info('Setting device update open');

    return () => {
      setAllowExit(true);
      if (
        latestStep.current !== 0 &&
        !latestCompleted.current &&
        latestDeviceConnection.current
      ) {
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
      const onSuccess = () => {
        setAuthState(2);
      };
      const onError = () => {
        setIsCompleted(-1);
        setAuthState(-1);
      };
      checkLatestFirmware(onSuccess, onError);
    }
  }, [authState]);

  useEffect(() => {
    if (isCompleted === 1 && isApproved === 2) {
      setAllowExit(false);
    } else {
      setAllowExit(true);
    }
  }, [isCompleted, isApproved]);

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

  return (
    <Root container style={{ padding: '0.5rem 0rem' }}>
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
            {errorObj.showError()}
          </Typography>
          <div className={classes.errorButtons}>
            <CustomButton
              variant="outlined"
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
    </Root>
  );
};

DeviceUpgrade.propTypes = DeviceSettingItemPropTypes;

export default DeviceUpgrade;
