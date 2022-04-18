import Step from '@mui/material/Step';
import StepConnector from '@mui/material/StepConnector';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import { Theme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import withStyles from '@mui/styles/withStyles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import CreateComponent from '../../../../components/createComponent';

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
    background: 'rgba(0,0,0,0)'
  },
  stepLabel: {
    color: theme.palette.primary.light
  }
}));

type StepperProps = {
  stepsData: any[][];
  handleClose: () => void;
};

const DeviceSetup: React.FC<StepperProps> = ({ stepsData, handleClose }) => {
  const classes = useStyles();
  const [activeStep, setActiveStep] = React.useState(0);

  const handleNext = () => {
    if (activeStep + 1 < stepsData.length) {
      setActiveStep(prevActiveStep => prevActiveStep + 1);
    } else {
      setActiveStep(0);
    }
  };

  const handleKeyPressDown = (e: KeyboardEvent) => {
    if (e.ctrlKey) {
      if (e.keyCode === 84) {
        handleClose();
      } else if (e.keyCode === 83) {
        setActiveStep(activeStep + 1);
      }
    }
  };

  React.useEffect(() => {
    if (process.env.BUILD_TYPE === 'debug') {
      window.addEventListener('keydown', handleKeyPressDown);
    }

    return () => {
      if (process.env.BUILD_TYPE === 'debug') {
        window.removeEventListener('keydown', handleKeyPressDown);
      }
    };
  });

  return (
    <div className={classes.root}>
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

DeviceSetup.propTypes = {
  stepsData: PropTypes.array.isRequired,
  handleClose: PropTypes.func.isRequired
};

export default DeviceSetup;
