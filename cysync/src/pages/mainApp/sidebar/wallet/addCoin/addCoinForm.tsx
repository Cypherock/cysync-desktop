import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Button from '@mui/material/Button';
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
import PropTypes from 'prop-types';
import React from 'react';

import success from '../../../../../assets/icons/generic/success.png';
import CreateComponent from '../../../../../components/createComponent';
import ErrorBox from '../../../../../designSystem/designComponents/dialog/errorDialog';
import ModAvatar from '../../../../../designSystem/designComponents/icons/AvatarIcon';
import {
  useAddCoinContext,
  useConnection
} from '../../../../../store/provider';
import Analytics from '../../../../../utils/analytics';
import logger from '../../../../../utils/logger';

import initialCoins from './coins';

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

const STEP_PREFIX = 'AddCoin-Step';

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

const PREFIX = 'AddCoin';

const classes = {
  root: `${PREFIX}-root`,
  backButton: `${PREFIX}-backButton`,
  instructions: `${PREFIX}-instructions`,
  stepRoot: `${PREFIX}-stepRoot`,
  stepperRoot: `${PREFIX}-stepperRoot`,
  stepLabel: `${PREFIX}-stepLabel`,
  successContainer: `${PREFIX}-successContainer`,
  button: `${PREFIX}-button`
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
  },
  [`& .${classes.successContainer}`]: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '20rem'
  },
  [`& .${classes.button}`]: {
    background: '#71624C',
    color: theme.palette.text.primary,
    textTransform: 'none',
    padding: '0.5rem 1.5rem',
    marginBottom: '1rem',
    '&:hover': {
      background: theme.palette.secondary.dark
    }
  }
}));

type StepperProps = {
  stepsData: any[];
  handleClose: (abort?: boolean) => void;
  coinsPresent: any[];
};

const AddCoinForm: React.FC<StepperProps> = ({
  stepsData,
  handleClose,
  coinsPresent
}) => {
  const {
    activeStep,
    setActiveStep,
    coinAdder,
    isXpubMissing,
    setIsAddCoinLoading
  } = useAddCoinContext();

  const { deviceConnection } = useConnection();

  const handleNext = () => {
    if (stepsData.length > activeStep) {
      setActiveStep(prevActiveStep => prevActiveStep + 1);
    } else {
      setActiveStep(0);
    }
  };

  // Using JSON.parse to create a deep copy instead of passing by referrence
  const [coins, setCoins] = React.useState(
    JSON.parse(JSON.stringify(initialCoins))
  );

  const handleErrorBoxClose = () => {
    handleClose(true);
    setActiveStep(0);
    coinAdder.clearErrorObj();
    coinAdder.resetHooks();
  };

  const onRetry = () => {
    Analytics.Instance.event(
      Analytics.Categories.ADD_COIN,
      Analytics.Actions.RETRY
    );
    logger.info('Add coin form retry');
    setIsAddCoinLoading(false);
    coinAdder.clearErrorObj();
    setCoins(JSON.parse(JSON.stringify(initialCoins)));
    if (deviceConnection) coinAdder.cancelAddCoin(deviceConnection);
    coinAdder.resetHooks();
    setActiveStep(0);
  };

  return (
    <Root className={classes.root}>
      <ErrorBox
        open={coinAdder.errorObj.isSet}
        handleClose={handleErrorBoxClose}
        errorObj={coinAdder.errorObj}
        text={coinAdder.errorObj.showError()}
        actionText="Retry"
        handleAction={onRetry}
        flow="Adding Coin"
        detailedText={coinAdder.detailedMessage}
        detailedCTAText="Show Details"
      />
      {activeStep === 4 ? (
        <>
          <div className={classes.successContainer}>
            <ModAvatar src={success} alt="success" />
            <Typography
              color="textPrimary"
              style={{ margin: '1rem 0rem 5rem', fontWeight: 700 }}
            >
              {isXpubMissing
                ? 'Wallet configured successfully'
                : 'Coin added successfully'}
            </Typography>
            <Button
              variant="contained"
              className={classes.button}
              onClick={() => handleClose(false)}
            >
              Go to Wallet
            </Button>
          </div>
        </>
      ) : (
        <>
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
                handleClose,
                coins,
                setCoins,
                coinsPresent,
                isXpubMissing
              }}
            />
          </div>
        </>
      )}
    </Root>
  );
};

AddCoinForm.propTypes = {
  stepsData: PropTypes.array.isRequired,
  handleClose: PropTypes.func.isRequired,
  coinsPresent: PropTypes.array.isRequired
};

export default AddCoinForm;
