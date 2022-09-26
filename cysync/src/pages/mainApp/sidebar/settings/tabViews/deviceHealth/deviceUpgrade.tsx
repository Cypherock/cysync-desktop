import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AlertIcon from '@mui/icons-material/ReportProblemOutlined';
import { Button, Grid, Tooltip } from '@mui/material';
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
import { useLocation, useNavigate } from 'react-router-dom';

import success from '../../../../../../assets/icons/generic/success.png';
import Routes from '../../../../../../constants/routes';
import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import AvatarIcon from '../../../../../../designSystem/designComponents/icons/AvatarIcon';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import {
  DeviceUpgradeErrorResolutionState,
  useDeviceUpgrade
} from '../../../../../../store/hooks/flows';
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
  setAllowExit
}) => {
  const navigate = useNavigate();

  const [authState, setAuthState] = React.useState<-1 | 0 | 1 | 2>(0);
  const [connStatus, setConnStatus] = React.useState<-1 | 0 | 1 | 2>(1);
  const [initialStart, setInitialStart] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(0);

  const [retryEnabled, setRetryEnabled] = React.useState(false);
  const [isDisconnected, setIsDisconnected] = React.useState(false);
  const [waitForReconnect, setWaitForReconnect] = React.useState(false);

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
    upgradeAvailable,
    updateProgress,
    isAuthenticated,
    isUpdated,
    setIsDeviceUpdating,
    setBlockNewConnection,
    errorResolutionState,
    setBlockConnectionPopup
  } = useDeviceUpgrade();

  const latestDeviceConnection = useRef<any>();
  const latestCompleted = useRef<boolean>();
  const latestStep = useRef<number>();

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const isRefresh = Boolean(query.get('isRefresh'));

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
    setBlockConnectionPopup(true);
    Analytics.Instance.event(
      Analytics.Categories.DEVICE_UPDATE,
      Analytics.Actions.OPEN
    );
    logger.info('Setting device update open');

    return () => {
      setBlockConnectionPopup(false);
      setAllowExit(true);
      setIsDeviceUpdating(false);
      if (latestStep.current !== 0 && !latestCompleted.current) {
        if (latestDeviceConnection.current) {
          cancelDeviceUpgrade(latestDeviceConnection.current);
        } else {
          setBlockNewConnection(false);
        }
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

    if (waitForReconnect) {
      if (!deviceConnection) {
        setIsDisconnected(true);
      }

      if (isDisconnected && deviceConnection && !inBackgroundProcess) {
        setRetryEnabled(true);
      } else {
        setRetryEnabled(false);
      }
    }
  }, [deviceConnection, inBackgroundProcess]);

  const handleCheckLatestFirmware = () => {
    const onSuccess = () => {
      setAuthState(2);
      if (isRefresh) {
        logger.info('Device Upgrade is refreshing');
        handleNext();
      }
    };
    const onError = () => {
      setIsCompleted(-1);
      setAuthState(-1);
    };
    checkLatestFirmware(onSuccess, onError);
  };

  useEffect(() => {
    if (authState === 1) {
      handleCheckLatestFirmware();
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
      name: 'Update',
      element: (
        <Authentication
          progress={updateProgress}
          isAuthenticated={isAuthenticated}
          isUpdated={isUpdated}
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
      if (
        errorResolutionState ===
        DeviceUpgradeErrorResolutionState.RECONNECT_REQUIRED
      ) {
        setRetryEnabled(false);
        setIsDisconnected(!deviceConnection);
        setWaitForReconnect(true);
      } else {
        setRetryEnabled(true);
      }
    } else {
      setWaitForReconnect(false);
      setIsDisconnected(false);
      setRetryEnabled(false);
    }

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
    if (
      errorResolutionState ===
      DeviceUpgradeErrorResolutionState.DEVICE_AUTH_REQUIRED
    ) {
      navigate(Routes.settings.device.index);
    } else {
      if (activeStep === 0) {
        handleCheckLatestFirmware();
      } else {
        handleRetry();
      }
    }
  };

  const getMainContent = () => {
    if (isCompleted === 2) {
      return (
        <Grid item xs={12} className={classes.rootCenter}>
          <AvatarIcon src={success} alt="success" />
          <Typography
            color="secondary"
            align="center"
            variant="h5"
            style={{ margin: '1rem 0rem 6rem' }}
          >
            Device Update Successful
          </Typography>
          <Button
            color="secondary"
            onClick={handleDeviceHealthTabClose}
            variant="contained"
            autoFocus
          >
            Ok
          </Button>
        </Grid>
      );
    }

    if (authState === 2 && activeStep === 0) {
      return (
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
              autoFocus
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
      );
    }

    if (isCompleted === -1) {
      const isAuthFailed =
        errorResolutionState ===
        DeviceUpgradeErrorResolutionState.DEVICE_AUTH_REQUIRED;

      return (
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
            {isAuthFailed
              ? 'Firmware Verification Failed'
              : 'Device Update Failed'}
          </Typography>
          <Typography
            color="textSecondary"
            style={{ margin: '1rem 0rem 6rem' }}
          >
            {errorObj.showError()}
          </Typography>
          <div className={classes.errorButtons}>
            {retryEnabled ? (
              <CustomButton
                variant="outlined"
                onClick={handleOnRetry}
                style={{ textTransform: 'none', padding: '0.5rem 2rem' }}
                autoFocus
              >
                {isAuthFailed ? 'Ok' : 'Retry'}
              </CustomButton>
            ) : (
              <Tooltip title="Disconnect and reconnect the X1 wallet">
                <span>
                  <CustomButton
                    variant="outlined"
                    onClick={handleOnRetry}
                    style={{ textTransform: 'none', padding: '0.5rem 2rem' }}
                    disabled={true}
                  >
                    {isAuthFailed ? 'Ok' : 'Retry'}
                  </CustomButton>
                </span>
              </Tooltip>
            )}
            <CustomButton
              color="primary"
              onClick={handleFeedbackOpen}
              style={{ padding: '0.5rem 2rem' }}
            >
              Report
            </CustomButton>
          </div>
        </Grid>
      );
    }

    return (
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
                step === steps.length - 1
                  ? isAuthenticated === 2
                  : step < activeStep
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
            Do not disconnect X1 wallet while it is being updated. This may take
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
    );
  };

  return (
    <Root container style={{ padding: '0.5rem 0rem' }}>
      <Grid item xs={12} className={classes.header}>
        <Typography color="secondary" variant="h5">
          Device Update
        </Typography>
      </Grid>
      {getMainContent()}
    </Root>
  );
};

DeviceUpgrade.propTypes = DeviceSettingItemPropTypes;

export default DeviceUpgrade;
