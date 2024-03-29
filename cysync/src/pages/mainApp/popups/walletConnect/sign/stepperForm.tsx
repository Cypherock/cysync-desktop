import { FeatureName, isFeatureEnabled } from '@cypherock/communication';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Step from '@mui/material/Step';
import StepConnector from '@mui/material/StepConnector';
import { StepIconProps } from '@mui/material/StepIcon';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import { styled, Theme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import CreateComponent from '../../../../../components/createComponent';
import { UseSignMessageValues } from '../../../../../store/hooks';
import {
  useConnection,
  useWalletConnect,
  WalletConnectCallRequestMethodMap
} from '../../../../../store/provider';
import logger from '../../../../../utils/logger';

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

const STEP_PREFIX = 'WalletSend-Step';

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
      color: theme.palette.text.secondary
    },
    active: {
      color: `${theme.palette.secondary.main} !important`
    },
    completed: {
      color: `${theme.palette.secondary.light} !important`
    }
  })
)(StepLabel);

const PREFIX = 'WalletSend';

const classes = {
  root: `${PREFIX}-root`,
  backButton: `${PREFIX}-backButton`,
  instructions: `${PREFIX}-instructions`,
  stepRoot: `${PREFIX}-stepRoot`,
  stepperRoot: `${PREFIX}-stepperRoot`,
  stepLabel: `${PREFIX}-stepLabel`
};

const Root = styled('div')(({ theme }) => ({
  [`&.${classes.root}`]: {
    width: '100%'
  },
  [`& .${classes.backButton}`]: {
    marginRight: theme.spacing(1)
  },
  [`& .${classes.instructions}`]: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  [`& .${classes.stepRoot}`]: {
    padding: 20,
    paddingLeft: 50,
    paddingRight: 50
  },
  [`& .${classes.stepperRoot}`]: {
    background: 'rgba(0,0,0,0)'
  },
  [`& .${classes.stepLabel}`]: {
    color: theme.palette.primary.light
  }
}));

type StepperProps = {
  stepsData: any[][];
  handleClose: () => void;
  signMessage: UseSignMessageValues;
};

const WalletConnectSignStepperForm: React.FC<StepperProps> = ({
  stepsData,
  handleClose,
  signMessage
}) => {
  const walletConnect = useWalletConnect();
  const { deviceSdkVersion } = useConnection();

  const [activeStep, setActiveStep] = useState(0);

  const [messageToSign, setMessageToSign] = React.useState<string | any>('');
  const [walletConnectSupported, setWalletConnectSupported] =
    React.useState(false);

  useEffect(() => {
    if (deviceSdkVersion)
      setWalletConnectSupported(
        isFeatureEnabled(FeatureName.WalletConnectSupport, deviceSdkVersion)
      );
  }, [deviceSdkVersion]);

  const decodeMessage = () => {
    try {
      let message = '';

      if (
        walletConnect.callRequestData.method ===
        WalletConnectCallRequestMethodMap.SIGN_PERSONAL
      ) {
        message = walletConnect.callRequestData?.params[0];
        setMessageToSign(Buffer.from(message.slice(2), 'hex').toString());
      } else if (
        walletConnect.callRequestData?.method ===
          WalletConnectCallRequestMethodMap.SIGN_TYPED ||
        walletConnect.callRequestData?.method ===
          WalletConnectCallRequestMethodMap.SIGN_TYPED_V4
      ) {
        setMessageToSign(JSON.parse(walletConnect.callRequestData.params[1]));
      } else {
        message = walletConnect.callRequestData.params[1];
        setMessageToSign(message);
      }
    } catch (error) {
      // Abort when the message is invalid
      logger.error(error);
      handleClose();
    }
  };

  React.useEffect(() => {
    if (walletConnect.callRequestData) {
      decodeMessage();
    }
  }, [walletConnect.callRequestData]);

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };

  const isJSON = React.useMemo(
    () => typeof messageToSign !== 'string',
    [messageToSign]
  );
  const isReadable = React.useMemo(
    () =>
      walletConnect.callRequestData?.method ===
      WalletConnectCallRequestMethodMap.SIGN_PERSONAL,
    [walletConnect.callRequestData]
  );

  return (
    <Root className={classes.root}>
      <Stepper
        alternativeLabel
        activeStep={activeStep}
        className={classes.stepperRoot}
        connector={<QontoConnector />}
      >
        {stepsData.map((data, step) => (
          <Step
            key={data[0]}
            completed={
              activeStep === stepsData.length - 1 ? true : step < activeStep
            }
          >
            <StyledStepLabel
              StepIconComponent={QontoStepIcon}
              className={classes.stepLabel}
            >
              {data[0]}
            </StyledStepLabel>
          </Step>
        ))}
      </Stepper>
      <div style={{ marginTop: '10px' }}>
        <CreateComponent
          component={stepsData[activeStep][1]}
          props={{
            handleNext,
            handleClose,
            signMessage,
            walletConnectSupported,
            messageToSign,
            isJSON,
            isReadable
          }}
        />
      </div>
    </Root>
  );
};

WalletConnectSignStepperForm.propTypes = {
  stepsData: PropTypes.array.isRequired,
  handleClose: PropTypes.func.isRequired,
  signMessage: PropTypes.any.isRequired
};

export default WalletConnectSignStepperForm;
