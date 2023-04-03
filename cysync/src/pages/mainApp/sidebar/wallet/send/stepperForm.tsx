import {
  CoinGroup,
  COINS,
  Erc20CoinData,
  EthCoinData,
  EthCoinMap
} from '@cypherock/communication';
import { EthereumWallet } from '@cypherock/wallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Step from '@mui/material/Step';
import StepConnector from '@mui/material/StepConnector';
import { StepIconProps } from '@mui/material/StepIcon';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import { styled, Theme } from '@mui/material/styles';
import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';
import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import { clipboard } from 'electron';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import CreateComponent from '../../../../../components/createComponent';
import ErrorBox from '../../../../../designSystem/designComponents/dialog/errorDialog';
import { useDebouncedFunction } from '../../../../../store/hooks';
import {
  changeFormatOfOutputList,
  TriggeredBy
} from '../../../../../store/hooks/flows';
import {
  useCurrentCoin,
  useCustomAccountContext,
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
  handleClose: (abort?: boolean) => void;
  onSuccess?: (result: string) => void;
  onReject?: (reason?: string) => void;
  txnParams?: {
    from: string;
    to: string;
    data?: string;
    gas?: string; // hex
    gasPrice?: string; // hex
    value?: string; // hex
    nonce?: string; // hex
  };
  resultType?: 'signature' | 'hash';
  triggeredBy?: TriggeredBy;
};

const SendForm: React.FC<StepperProps> = ({
  stepsData,
  handleClose,
  onSuccess,
  onReject,
  txnParams,
  resultType,
  triggeredBy
}) => {
  const { sendForm, sendTransaction } = useSendTransactionContext();
  const [activeStep, setActiveStep] = useState(0);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [maximum, setMaximum] = React.useState(false);
  const [gasLimit, setGasLimit] = React.useState(21000);
  const [l1Cost, setL1Cost] = React.useState('0');
  const [gasLimitError, setGasLimitError] = React.useState<string | undefined>(
    undefined
  );
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
    { id: 1, recipient: ' ', amount: '', errorRecipient: '', errorAmount: '' }
  ]);

  const [duplicateBatchAddresses, setDuplicateBatchAddresses] = useState<
    string[]
  >([]);

  // State Maintaining the Total of all
  const [total, setTotal] = React.useState(new BigNumber(0));

  // Set a constant fee default value for each coin in case the api call fails. Regularly update the file.
  const [transactionFee, setTransactionFee] = React.useState('75');

  const { coinDetails } = useCurrentCoin();
  const isBtcFork = COINS[coinDetails.coinId]?.group === CoinGroup.BitcoinForks;
  const { token } = useTokenContext();
  const { customAccount } = useCustomAccountContext();

  // Change the total according to the current state
  const handleTotal = () => {
    if (maxSend) {
      setTotal(new BigNumber(sendTransaction.sendMaxAmount));
    } else {
      let tempTotal = new BigNumber(0);
      batchRecipientData.forEach(recipient => {
        if (recipient.amount) {
          tempTotal = tempTotal.plus(new BigNumber(recipient.amount));
        }
      });
      setTotal(new BigNumber(tempTotal));
    }
  };

  useEffect(() => {
    handleTotal();
  }, [sendTransaction.sendMaxAmount, batchRecipientData]);

  const triggerCalcFee = () => {
    let coin;
    if (token) {
      coin = COINS[token.parentCoinId].tokenList[token.coinId];
    } else {
      coin = COINS[coinDetails.coinId];
    }
    let contractAddress: string | undefined;
    if (token && coin instanceof Erc20CoinData) {
      contractAddress = coin.address;
    }

    sendTransaction.handleEstimateFee({
      xpub: coinDetails.xpub,
      accountId: coinDetails.accountId,
      accountIndex: coinDetails.accountIndex,
      accountType: coinDetails.accountType,
      coinId: coinDetails.coinId,
      outputList: changeFormatOfOutputList(
        batchRecipientData,
        coinDetails.coinId,
        token?.coinId
      ),
      fees: parseFloat(transactionFee) || 0,
      isSendAll: maxSend,
      data: {
        gasLimit,
        l1Cost,
        contractAddress,
        contractAbbr: token
          ? COINS[coinDetails.coinId]?.tokenList[token.coinId]?.abbr
          : undefined,
        subCoinId: token?.coinId
      },
      customAccount: customAccount?.name
    });
  };

  const debouncedCaclFee = useDebouncedFunction(triggerCalcFee, 500);

  const triggerCalcGasLimit = async () => {
    const coin = COINS[coinDetails.coinId];

    let defaultLimit = 21000;
    // Refer: https://api.arbiscan.io/api?module=proxy&action=eth_estimateGas&data=0x&to=0xf6c3c3621f42ec1f1cd1207bb1571d93646ab29a&value=0xff22&gasPrice=0x51da038cc&gas=0x5f5e0ff&apikey=YourApiKeyToken
    if (coin.id === EthCoinMap.arbitrum) defaultLimit = 255595;

    if (
      !(
        estimateGasLimit &&
        coin instanceof EthCoinData &&
        batchRecipientData.length > 0 &&
        batchRecipientData[0].recipient.length === 42
      )
    ) {
      return;
    }

    setIsButtonLoading(true);
    const wallet = new EthereumWallet(
      coinDetails.accountIndex,
      coinDetails.xpub,
      coin
    );
    const fromAddress = wallet.address;
    const toAddress = batchRecipientData[0].recipient.trim();
    const { network } = coin;
    const tokenData = coin.tokenList[token?.coinId];
    const contractAddress = tokenData?.address;
    // According to our research, amount does not matter in estimating gas limit, small or large,
    let amount = '1';

    if (
      maxSend &&
      sendTransaction.sendMaxAmount &&
      Number(sendTransaction.sendMaxAmount) > 0
    ) {
      amount = new BigNumber(sendTransaction.sendMaxAmount)
        .multipliedBy(tokenData?.multiplier)
        .toString(10);
    }

    if (
      batchRecipientData[0].amount &&
      Number(batchRecipientData[0].amount) > 0
    ) {
      amount = new BigNumber(batchRecipientData[0].amount)
        .multipliedBy(tokenData?.multiplier)
        .toString(10);
    }

    const data =
      txnParams?.data ??
      wallet.generateContractData(
        contractAddress,
        toAddress,
        new BigNumber(amount)
      );

    const estimatedGas = await sendTransaction.handleEstimateGasLimit(
      fromAddress,
      toAddress,
      network,
      '0x0',
      contractAddress,
      data
    );
    const estimatedLimit =
      parseInt(estimatedGas?.gasLimit, 10) ||
      parseInt(txnParams?.gas, 16) ||
      defaultLimit;

    if (estimatedLimit) {
      setGasLimit(estimatedLimit);
      setL1Cost(estimatedGas?.l1Cost ?? '0');
      sendTransaction.updateL1FeeFromCost({
        cost: estimatedGas?.l1Cost ?? '0',
        coinId: coin.id,
        parentCoinId: coin.parentId
      });
    }
    setIsButtonLoading(false);
  };

  const debouncedCaclGasLimit = useDebouncedFunction(triggerCalcGasLimit, 500);

  const handleMaxSend = (isMaxSend: boolean) => {
    const newBatchRecipientData = batchRecipientData.map(data => {
      return {
        ...data,
        amount: isMaxSend ? undefined : ''
      };
    });

    addbatchRecipientData([...newBatchRecipientData]);
  };

  useEffect(() => {
    const coin = COINS[coinDetails.coinId];
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
    sendTransaction.setIsEstimatingFees(true);
    debouncedCaclFee();
    if (!transactionFee || (parseFloat(transactionFee) || 0) <= 0) {
      setButtonDisabled(true);
    } else {
      setButtonDisabled(false);
    }
  }, [transactionFee, batchRecipientData]);

  useEffect(() => {
    debouncedCaclGasLimit();
  }, [batchRecipientData, sendTransaction.sendMaxAmount]);

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
        amount: '',
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
            dataCopy.errorAmount = '';
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
    const isEthereum = COINS[coinDetails.coinId].group === CoinGroup.Ethereum;
    let index = 0;

    for (const recipient of batchRecipientData) {
      const amount = new BigNumber(
        recipient.amount === undefined ? '' : recipient.amount
      );
      let error = '';
      if (amount.isNaN() || amount.isZero() || amount.isNegative()) {
        // Allow `0` amount transaction on ETH, and 0 amount is valid when it's a max send txn
        if (!(amount.isZero() && isEthereum) && !maxSend) {
          error = 'Enter a valid amount.';
          isValid = false;
        }
      }

      copyBatchRecipientData[index].errorAmount = error;
      index++;
    }

    addbatchRecipientData(copyBatchRecipientData);

    return isValid;
  };

  const validateInputs = () => {
    const isAmountValid = verifyRecipientAmount();

    const isEthereum = COINS[coinDetails.coinId].group === CoinGroup.Ethereum;

    const isGasLimitValid = isEthereum ? gasLimit > 0 : true;

    if (isGasLimitValid) {
      setGasLimitError(undefined);
    } else {
      setGasLimitError('Gas limit should be more than 0');
    }

    return isAmountValid && isGasLimitValid;
  };

  const handleVerificationErrors = (
    id: number,
    address: string,
    error: boolean,
    errorString?: string
  ) => {
    const copyBatchRecipientData = batchRecipientData.map(recipient => {
      const copyRecipient = recipient;
      if (
        copyRecipient.id === id &&
        copyRecipient.recipient.trim() === address.trim()
      ) {
        if (!error) {
          copyRecipient.errorRecipient = `This is not a valid ${
            COINS[coinDetails.coinId].name
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
    setTransactionFee(
      e.target.value
        ? isBtcFork
          ? Math.round(e.target.value)
          : e.target.value
        : e.target.value
    );
  };

  const handleTransactionFeeChangeSlider = (fee: number) => {
    setTransactionFee(fee.toString());
  };

  const handleNext = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };
  const resetFlow = () => {
    sendTransaction.clearErrorObj();
    sendTransaction.resetHooks();
    setActiveStep(0);
  };

  const handleErrorBoxClose = () => {
    handleClose(false);
    sendTransaction.clearErrorObj();
    sendTransaction.resetHooks();
  };

  const externalSetMaxSend = (val: boolean) => {
    if (val) {
      sendTransaction.setIsEstimatingFees(true);
      addbatchRecipientData(
        batchRecipientData.map(elem => ({ ...elem, errorAmount: '' }))
      );
    }
    setMaxSend(val);
  };

  return (
    <Root className={classes.root}>
      <ErrorBox
        open={sendTransaction.errorObj.isSet && sendForm}
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
            handleMaxSend,
            handleNext,
            resetFlow,
            maximum,
            activeButton,
            feeType,
            batchRecipientData,
            addbatchRecipientData,
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
            validateInputs,
            setTransactionFee,
            buttonDisabled,
            gasLimit,
            l1Cost,
            gasLimitError,
            setGasLimit,
            handleCopyFromClipboard,
            maxSend,
            setMaxSend: externalSetMaxSend,
            handleClose,
            estimateGasLimit,
            setEstimateGasLimit,
            duplicateBatchAddresses,
            isButtonLoading,
            onSuccess,
            onReject,
            txnParams,
            resultType,
            triggeredBy
          }}
        />
      </div>
    </Root>
  );
};

SendForm.propTypes = {
  stepsData: PropTypes.array.isRequired,
  handleClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  onReject: PropTypes.func,
  txnParams: PropTypes.exact({
    from: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    data: PropTypes.string,
    gas: PropTypes.string,
    gasPrice: PropTypes.string,
    value: PropTypes.string,
    nonce: PropTypes.string
  }),
  resultType: PropTypes.oneOf(['signature', 'hash']),
  triggeredBy: PropTypes.number
};

export default SendForm;
