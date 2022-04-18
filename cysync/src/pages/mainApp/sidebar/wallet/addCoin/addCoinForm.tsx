import Button from '@mui/material/Button';
import Step from '@mui/material/Step';
import StepConnector from '@mui/material/StepConnector';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import { Theme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import withStyles from '@mui/styles/withStyles';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

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
  },
  successContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '20rem'
  },
  button: {
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
  const classes = useStyles();

  const {
    activeStep,
    setActiveStep,
    coinAdder,
    isXpubMissing,
    setIsAddCoinLoading
  } = useAddCoinContext();

  const { deviceConnection, devicePacketVersion } = useConnection();

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
    coinAdder.setErrorMessage('');
    coinAdder.resetHooks();
  };

  const onRetry = () => {
    Analytics.Instance.event(
      Analytics.Categories.ADD_COIN,
      Analytics.Actions.RETRY
    );
    logger.info('Add coin form retry');
    setIsAddCoinLoading(false);
    coinAdder.setErrorMessage('');
    setCoins(JSON.parse(JSON.stringify(initialCoins)));
    if (deviceConnection)
      coinAdder.cancelAddCoin(deviceConnection, devicePacketVersion);
    coinAdder.resetHooks();
    setActiveStep(0);
  };

  useEffect(() => {
    if (coinAdder.errorMessage) {
      Analytics.Instance.event(
        Analytics.Categories.ADD_COIN,
        Analytics.Actions.ERROR
      );
    }
  }, [coinAdder.errorMessage]);

  return (
    <div className={classes.root}>
      <ErrorBox
        open={!!coinAdder.errorMessage}
        handleClose={handleErrorBoxClose}
        text={coinAdder.errorMessage}
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
    </div>
  );
};

AddCoinForm.propTypes = {
  stepsData: PropTypes.array.isRequired,
  handleClose: PropTypes.func.isRequired,
  coinsPresent: PropTypes.array.isRequired
};

export default AddCoinForm;
