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
import React, { useState } from 'react';

import CreateComponent from '../../../../../components/createComponent';
import ErrorBox from '../../../../../designSystem/designComponents/dialog/errorDialog';
import { useReceiveTransactionContext } from '../../../../../store/provider';
import Analytics from '../../../../../utils/analytics';
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

const STEP_PREFIX = 'WalletReceive-Step';

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

const PREFIX = 'WalletReceive';

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
  handleClose: (abort?: boolean) => void;
  handleXpubMissing: () => void;
  exitFlowOnErrorClose: boolean;
  setExitFlowOnErrorClose: (value: boolean) => void;
};

const ReceiveForm: React.FC<StepperProps> = ({
  stepsData,
  handleClose,
  handleXpubMissing,
  exitFlowOnErrorClose,
  setExitFlowOnErrorClose
}) => {
  const { receiveTransaction } = useReceiveTransactionContext();
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    if (stepsData.length > activeStep + 1) {
      setActiveStep(prevActiveStep => prevActiveStep + 1);
    } else {
      setActiveStep(0);
    }
  };

  const handleErrorBoxClose = () => {
    receiveTransaction.clearErrorObj();
    receiveTransaction.setXpubMissing(false);
    receiveTransaction.resetHooks();
    if (exitFlowOnErrorClose) handleClose();
    // Go to the Receive address component to display the unverified address
    setActiveStep(stepsData.length - 2);
  };

  const onResyncCoins = () => {
    Analytics.Instance.event(
      Analytics.Categories.RESYNC_COIN,
      Analytics.Actions.CLICKED
    );
    logger.info('Resync coin initiated');
    handleClose(true);
    receiveTransaction.clearErrorObj();
    receiveTransaction.setXpubMissing(false);
    handleXpubMissing();
  };

  return (
    <Root className={classes.root}>
      <ErrorBox
        open={receiveTransaction.errorObj.isSet}
        closeText={receiveTransaction.xpubMissing ? 'No' : undefined}
        handleClose={handleErrorBoxClose}
        errorObj={receiveTransaction.errorObj}
        actionText={receiveTransaction.xpubMissing ? 'Yes' : undefined}
        handleAction={
          receiveTransaction.xpubMissing ? onResyncCoins : undefined
        }
        flow="Receiving Transaction"
      />

      {stepsData[activeStep][0] === 'Replace' || (
        <Stepper
          alternativeLabel
          activeStep={activeStep}
          className={classes.stepperRoot}
          connector={<QontoConnector />}
        >
          {stepsData
            .filter(data => {
              return data[0] !== 'Replace';
            })
            .map((data, step) => (
              <Step
                key={data[0]}
                completed={
                  activeStep === stepsData.length - 2
                    ? Boolean(receiveTransaction.receiveAddress)
                    : step < activeStep
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
      )}
      <div>
        <CreateComponent
          component={stepsData[activeStep][1]}
          props={{
            handleNext,
            handleClose,
            setExitFlowOnErrorClose
          }}
        />
      </div>
    </Root>
  );
};

ReceiveForm.propTypes = {
  stepsData: PropTypes.array.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleXpubMissing: PropTypes.func.isRequired,
  exitFlowOnErrorClose: PropTypes.bool.isRequired,
  setExitFlowOnErrorClose: PropTypes.func.isRequired
};

export default ReceiveForm;
