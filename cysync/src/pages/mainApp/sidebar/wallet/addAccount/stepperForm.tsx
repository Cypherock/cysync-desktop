import { ALLCOINS as COINS } from '@cypherock/communication';
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
import { clipboard } from 'electron';
import PropTypes from 'prop-types';
import React, { useState } from 'react';

import CreateComponent from '../../../../../components/createComponent';
import ErrorBox from '../../../../../designSystem/designComponents/dialog/errorDialog';
import {
  useCurrentCoin,
  useSendTransactionContext
} from '../../../../../store/provider';

import { RecipientData } from './formStepComponents/StepComponentProps';

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

const STEP_PREFIX = 'WalletAddAccount-Step';

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

const PREFIX = 'WalletAddAccount';

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
};

const SendForm: React.FC<StepperProps> = ({ stepsData, handleClose }) => {
  const { sendTransaction } = useSendTransactionContext();
  const [activeStep, setActiveStep] = useState(0);

  // State for all the data related to the Recipient
  const [recipientData, setRecipientData] = React.useState<RecipientData>({
    id: 1,
    recipient: ' ',
    amount: '',
    errorRecipient: '',
    errorAmount: ''
  });

  // Set a constant fee default value for each coin in case the api call fails. Regularly update the file.
  const [transactionFee, setTransactionFee] = React.useState('300000000000000'); // Max gas limit for NEAR.

  const { coinDetails } = useCurrentCoin();

  const handleInputChange = (e: any) => {
    e.persist();
    const copyStateRecipientData = [recipientData].map(data => {
      const dataCopy = data;
      if (e.target.name === 'reciever_addr') {
        dataCopy.recipient = e.target.value
          ? e.target.value.trim()
          : e.target.value;
      }
      return dataCopy;
    });

    setRecipientData({ ...copyStateRecipientData[0] });
  };
  const handleCopyFromClipboard = (id: string) => {
    const clipBoardText = clipboard.readText().trim();

    const copyStateRecipientData = [recipientData].map(data => {
      const dataCopy = data;
      if (dataCopy.id === parseInt(id, 10)) {
        dataCopy.recipient = clipBoardText;
      }
      return dataCopy;
    });
    setRecipientData({ ...copyStateRecipientData[0] });
  };

  const handleVerificationErrors = (
    id: number,
    address: string,
    error: boolean,
    errorString: string
  ) => {
    const copyRecipientData = [recipientData].map(recipient => {
      const copyRecipient = recipient;
      if (
        copyRecipient.id === id &&
        copyRecipient.recipient.trim() === address.trim()
      ) {
        if (!error) {
          copyRecipient.errorRecipient = `This is not a valid ${
            COINS[coinDetails.slug].name
          } address`;
        } else {
          copyRecipient.errorRecipient = '';
        }
        if (errorString) {
          copyRecipient.errorRecipient = errorString;
        }
      }
      return copyRecipient;
    });
    setRecipientData({ ...copyRecipientData[0] });
  };

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };

  const handleErrorBoxClose = () => {
    handleClose(false);
    sendTransaction.clearErrorObj();
    sendTransaction.resetHooks();
  };

  return (
    <Root className={classes.root}>
      <ErrorBox
        open={sendTransaction.errorObj.isSet}
        handleClose={handleErrorBoxClose}
        errorObj={sendTransaction.errorObj}
        flow="Sending Transaction"
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
      <div style={{ marginTop: '10px' }}>
        <CreateComponent
          component={stepsData[activeStep][1]}
          props={{
            handleNext,
            recipientData,
            transactionFee,
            handleInputChange,
            handleVerificationErrors,
            setTransactionFee,
            handleCopyFromClipboard,
            handleClose
          }}
        />
      </div>
    </Root>
  );
};

SendForm.propTypes = {
  stepsData: PropTypes.array.isRequired,
  handleClose: PropTypes.func.isRequired
};

export default SendForm;
