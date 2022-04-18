import {
  ALLCOINS as COINS,
  Erc20CoinData,
  ERC20TOKENS,
  EthCoinData
} from '@cypherock/communication';
import { EthereumWallet } from '@cypherock/wallet';
import Step from '@mui/material/Step';
import StepConnector from '@mui/material/StepConnector';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import { Theme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import withStyles from '@mui/styles/withStyles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { clipboard } from 'electron';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import CreateComponent from '../../../../../components/createComponent';
import ErrorBox from '../../../../../designSystem/designComponents/dialog/errorDialog';
import { useDebouncedFunction } from '../../../../../store/hooks';
import { changeFormatOfOutputList } from '../../../../../store/hooks/flows';
import {
  useCurrentCoin,
  useSendTransactionContext,
  useTokenContext
} from '../../../../../store/provider';
import logger from '../../../../../utils/logger';

import {
  BatchRecipientData,
  DuplicateBatchAddresses
} from './formStepComponents/StepComponentProps';

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
};

const SendForm: React.FC<StepperProps> = ({ stepsData, handleClose }) => {
  const classes = useStyles();
  const { sendTransaction } = useSendTransactionContext();
  const [activeStep, setActiveStep] = useState(0);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [maximum, setMaximum] = React.useState(false);
  const [gasLimit, setGasLimit] = React.useState(21000);
  const [estimateGasLimit, setEstimateGasLimit] = React.useState(true);

  // State Management Semaphore for Button of Transaction Type
  // 0 => Single Transaction
  // 1 => Batch Transaction
  const [activeButton, setButton] = React.useState(0);

  // State Management Semaphore for Transaction Fee
  // true => slider
  // false => manual
  const [feeType, setFeeType] = React.useState(true);
  const [maxSend, setMaxSend] = useState(false);

  // State for all the data related to the Recipient
  const [batchRecipientData, addbatchRecipientData] = React.useState<
    BatchRecipientData[]
  >([
    { id: 1, recipient: ' ', amount: 0.0, errorRecipient: '', errorAmount: '' }
  ]);

  const [duplicateBatchAddresses, setDuplicateBatchAddresses] = useState<
    string[]
  >([]);

  // State Maintaining the Total of all
  const [total, setTotal] = React.useState(0);

  // Set a constant fee default value for each coin in case the api call fails. Regularly update the file.
  const [transactionFee, setTransactionFee] = React.useState(75);

  const { coinDetails } = useCurrentCoin();
  const { token } = useTokenContext();

  // Change the total according to the current state
  const handleTotal = () => {
    if (maxSend) {
      setTotal(sendTransaction.sendMaxAmount);
    } else {
      let tempTotal = +0;
      batchRecipientData.forEach(recipient => {
        if (recipient.amount) {
          tempTotal = +tempTotal + +recipient.amount;
        }
      });
      setTotal(tempTotal);
    }
  };

  useEffect(() => {
    handleTotal();
  }, [sendTransaction.sendMaxAmount, batchRecipientData]);

  const triggerCalcFee = () => {
    const coinAbbr = token ? token.coin : coinDetails.coin;
    const coin = COINS[coinAbbr];
    let contractAddress: string | undefined;
    if (token && coin instanceof Erc20CoinData) {
      contractAddress = coin.address;
    }

    sendTransaction.handleEstimateFee(
      coinDetails.xpub,
      coinDetails.zpub,
      coinDetails.coin,
      changeFormatOfOutputList(batchRecipientData, coinDetails.coin, token),
      transactionFee,
      maxSend,
      {
        gasLimit,
        contractAddress,
        contractAbbr: token ? coinAbbr.toLowerCase() : undefined
      }
    );
  };

  const debouncedCaclFee = useDebouncedFunction(triggerCalcFee, 500);

  const triggerCalcGasLimit = async () => {
    const coin = COINS[coinDetails.coin];
    if (
      !(
        estimateGasLimit &&
        coin instanceof EthCoinData &&
        token &&
        batchRecipientData.length > 0 &&
        batchRecipientData[0].recipient.length === 42
      )
    ) {
      return;
    }
    setButtonDisabled(true);
    const wallet = new EthereumWallet(coinDetails.xpub, coin);
    const fromAddress = wallet.address;
    const toAddress = batchRecipientData[0].recipient.trim();
    const { network } = coin;
    const tokenData = ERC20TOKENS[token.coin];
    const contractAddress = tokenData.address;
    // According to our research, amount does not matter in estimating gas limit, small or large,
    let amount = 1;
    if (
      batchRecipientData[0].amount &&
      Number(batchRecipientData[0].amount) > 0
    ) {
      amount = Number(batchRecipientData[0].amount) * tokenData.multiplier;
    }

    const estimatedLimit = await sendTransaction.handleEstimateGasLimit(
      fromAddress,
      toAddress,
      network,
      contractAddress,
      amount
    );

    if (estimatedLimit) {
      setGasLimit(estimatedLimit);
    }
    setButtonDisabled(false);
  };

  const debouncedCaclGasLimit = useDebouncedFunction(triggerCalcGasLimit, 500);

  const handleMaxSend = (isMaxSend: boolean) => {
    const newBatchRecipientData = batchRecipientData.map(data => {
      return {
        ...data,
        amount: isMaxSend ? undefined : 0
      };
    });

    addbatchRecipientData([...newBatchRecipientData]);
  };

  useEffect(() => {
    const coin = COINS[coinDetails.coin];
    if (coin instanceof EthCoinData) {
      debouncedCaclFee();
    }
  }, [gasLimit]);

  useEffect(() => {
    if (estimateGasLimit) {
      debouncedCaclGasLimit();
    }
  }, [estimateGasLimit]);

  useEffect(() => {
    debouncedCaclFee();
  }, [transactionFee, batchRecipientData]);

  useEffect(() => {
    debouncedCaclGasLimit();
  }, [batchRecipientData]);

  useEffect(() => {
    handleMaxSend(maxSend);
  }, [maxSend]);

  const addBatchTransaction = () => {
    const lastElement = batchRecipientData[batchRecipientData.length - 1];
    const lastElementId = lastElement.id;
    addbatchRecipientData([
      ...batchRecipientData,
      {
        id: lastElementId + 1,
        recipient: '',
        amount: 0.0,
        errorRecipient: '',
        errorAmount: ''
      }
    ]);
  };

  const updateDuplicateAddresses = (batchRecipients: BatchRecipientData[]) => {
    const temp: DuplicateBatchAddresses = {};
    const dupIds: string[] = [];
    batchRecipients.forEach(data => {
      if (temp[data.recipient]) {
        if (!temp[data.recipient].ids.includes(data.id.toString())) {
          temp[data.recipient].ids.push(data.id.toString());
        }
      } else {
        temp[data.recipient.trim()] = {
          ids: [data.id.toString()]
        };
      }
    });
    Object.keys(temp).forEach(addr => {
      if (temp[addr].ids.length > 1) {
        temp[addr].ids.forEach(id => {
          if (temp[addr].ids[0] !== id) {
            dupIds.push(id);
          }
        });
      }
    });
    setDuplicateBatchAddresses(dupIds);
  };

  const handleDelete = (e: any) => {
    const { id } = e;
    const newState = batchRecipientData.filter(
      data => data.id !== parseInt(id, 10)
    );
    if (newState.length > 0) {
      updateDuplicateAddresses(newState);
      addbatchRecipientData([...newState]);
    } else {
      logger.warning('Must have at-least one Recipient');
    }
  };

  const handleInputChange = (e: any) => {
    e.persist();
    const copyStateBatchRecipientData = batchRecipientData.map(data => {
      const dataCopy = data;
      if (dataCopy.id === parseInt(e.target.id, 10)) {
        if (e.target.name === 'reciever_addr') {
          dataCopy.recipient = e.target.value
            ? e.target.value.trim()
            : e.target.value;
        }
        if (e.target.name === 'amount') {
          if (Number(e.target.value) >= 0 || e.target.value === '') {
            dataCopy.amount = e.target.value;
          }
        }
      }
      return dataCopy;
    });

    if (e.target.name === 'reciever_addr') {
      updateDuplicateAddresses(copyStateBatchRecipientData);
    }

    addbatchRecipientData([...copyStateBatchRecipientData]);
  };

  const handleCopyFromClipboard = (id: string) => {
    const clipBoardText = clipboard.readText().trim();

    const copyStateBatchRecipientData = batchRecipientData.map(data => {
      const dataCopy = data;
      if (dataCopy.id === parseInt(id, 10)) {
        dataCopy.recipient = clipBoardText;
      }
      return dataCopy;
    });
    addbatchRecipientData([...copyStateBatchRecipientData]);
  };

  const verifyRecipientAmount = () => {
    const copyBatchRecipientData: BatchRecipientData[] = JSON.parse(
      JSON.stringify(batchRecipientData)
    );
    let isValid = true;
    const { isEth } = COINS[coinDetails.coin];
    copyBatchRecipientData.forEach((elem, index) => {
      const amount = new BigNumber(
        elem.amount === undefined ? '' : elem.amount
      );
      let error = '';
      if (amount.isNaN() || amount.isZero() || amount.isNegative()) {
        // Allow `0` amount transaction on ETH, and 0 amount is valid when it's a max send txn
        if (!(amount.isZero() && isEth) && !maxSend) {
          error = 'Please enter a valid amount.';
          isValid = false;
        }
      }
      copyBatchRecipientData[index].errorAmount = error;
    });

    addbatchRecipientData(copyBatchRecipientData);

    return isValid;
  };

  const handleVerificationErrors = (
    id: number,
    address: string,
    error: boolean
  ) => {
    const copyBatchRecipientData = batchRecipientData.map(recipient => {
      const copyRecipient = recipient;
      if (
        copyRecipient.id === id &&
        copyRecipient.recipient.trim() === address.trim()
      ) {
        if (!error) {
          copyRecipient.errorRecipient = `This is not a valid ${
            COINS[coinDetails.coin].name
          } address`;
        } else {
          copyRecipient.errorRecipient = '';
        }
      }
      return copyRecipient;
    });
    addbatchRecipientData([...copyBatchRecipientData]);
  };

  const handleFeeType = () => {
    setFeeType(!feeType);
  };

  const changeButton = (currentButton: number) => {
    if (currentButton === 0) {
      addbatchRecipientData(batchRecipientData.filter((_elem, i) => i === 0));
    }
    setButton(currentButton);
  };

  const handleChange = () => {
    if (maximum) {
      setMaximum(false);
    } else {
      setMaximum(true);
    }
  };

  const handleTransactionFeeChange = (e: any) => {
    setTransactionFee(+e.target.value);
  };

  const handleTransactionFeeChangeSlider = (fee: number) => {
    setTransactionFee(fee);
  };

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };

  const handleErrorBoxClose = () => {
    handleClose(false);
    sendTransaction.setErrorMessage('');
    sendTransaction.resetHooks();
  };

  return (
    <div className={classes.root}>
      <ErrorBox
        open={!!sendTransaction.errorMessage}
        handleClose={handleErrorBoxClose}
        text={sendTransaction.errorMessage}
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
      <div>
        <CreateComponent
          component={stepsData[activeStep][1]}
          props={{
            handleMaxSend,
            handleNext,
            maximum,
            activeButton,
            feeType,
            batchRecipientData,
            total,
            transactionFee,
            addBatchTransaction,
            handleDelete,
            handleInputChange,
            handleTotal,
            handleFeeType,
            changeButton,
            handleChange,
            handleTransactionFeeChange,
            handleTransactionFeeChangeSlider,
            handleVerificationErrors,
            verifyRecipientAmount,
            setTransactionFee,
            buttonDisabled,
            gasLimit,
            setGasLimit,
            handleCopyFromClipboard,
            maxSend,
            setMaxSend,
            handleClose,
            estimateGasLimit,
            setEstimateGasLimit,
            duplicateBatchAddresses
          }}
        />
      </div>
    </div>
  );
};

SendForm.propTypes = {
  stepsData: PropTypes.array.isRequired,
  handleClose: PropTypes.func.isRequired
};

export default SendForm;
