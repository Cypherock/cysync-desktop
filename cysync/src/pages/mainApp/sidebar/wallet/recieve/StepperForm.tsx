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
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

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

const useQontoStepIconStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      color: theme.palette.text.primary,
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
      border: `1px solid ${theme.palette.text.secondary}`
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

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%'
  },
  backButton: {
    marginRight: theme.spacing(1)
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  stepRoot: {
    padding: 20,
    paddingLeft: 50,
    paddingRight: 50
  },
  stepperRoot: {
    background: theme.palette.primary.light
  },
  stepLabel: {
    color: theme.palette.primary.light
  }
}));

type StepperProps = {
  stepsData: any[][];
  handleClose: (abort?: boolean) => void;
  handleXpubMissing: () => void;
};

const ReceiveForm: React.FC<StepperProps> = ({
  stepsData,
  handleClose,
  handleXpubMissing
}) => {
  const classes = useStyles();

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
    receiveTransaction.setErrorMessage('');
    receiveTransaction.setXpubMissing(false);
    receiveTransaction.resetHooks();
    // Go to the Receive address component to display the unverified address
    setActiveStep(stepsData.length - 1);
  };

  const onResyncCoins = () => {
    Analytics.Instance.event(
      Analytics.Categories.RESYNC_COIN,
      Analytics.Actions.CLICKED
    );
    logger.info('Resync coin initiated');
    handleClose(true);
    receiveTransaction.setErrorMessage('');
    receiveTransaction.setXpubMissing(false);
    handleXpubMissing();
  };

  useEffect(() => {
    if (receiveTransaction.errorMessage) {
      Analytics.Instance.event(
        Analytics.Categories.RECEIVE_ADDR,
        Analytics.Actions.ERROR,
        receiveTransaction.xpubMissing ? 'Xpub missing' : undefined
      );
    }
  }, [receiveTransaction.errorMessage]);

  return (
    <div className={classes.root}>
      <ErrorBox
        open={!!receiveTransaction.errorMessage}
        closeText={receiveTransaction.xpubMissing ? 'No' : undefined}
        handleClose={handleErrorBoxClose}
        text={receiveTransaction.errorMessage}
        actionText={receiveTransaction.xpubMissing ? 'Yes' : undefined}
        handleAction={
          receiveTransaction.xpubMissing ? onResyncCoins : undefined
        }
        flow="Receiving Transaction"
      />

      <Stepper
        alternativeLabel
        activeStep={activeStep}
        className={classes.stepperRoot}
        connector={<QontoConnector />}
      >
        {stepsData.map(data => (
          <Step key={data[0]}>
            <StyledStepLabel
              StepIconComponent={QontoStepIcon}
              className={classes.stepLabel}
            >
              {data[0]}
            </StyledStepLabel>
          </Step>
        ))}
      </Stepper>
      <div>
        <CreateComponent
          component={stepsData[activeStep][1]}
          props={{
            handleNext,
            handleClose
          }}
        />
      </div>
    </div>
  );
};

ReceiveForm.propTypes = {
  stepsData: PropTypes.array.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleXpubMissing: PropTypes.func.isRequired
};

export default ReceiveForm;
