import {
  CoinGroup,
  COINS,
  EthCoinMap,
  FeatureName,
  isFeatureEnabled,
  NearCoinData
} from '@cypherock/communication';
import { NearWallet } from '@cypherock/wallet';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import AlertIcon from '@mui/icons-material/ReportProblemOutlined';
import { Alert, Skeleton, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import { styled, Theme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { createStyles, withStyles } from '@mui/styles';
import BigNumber from 'bignumber.js';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';

import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import CustomIconButton from '../../../../../../designSystem/designComponents/buttons/customIconButton';
import SwitchButton from '../../../../../../designSystem/designComponents/buttons/switchButton';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import Checkbox from '../../../../../../designSystem/designComponents/input/checkbox';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import ICONS from '../../../../../../designSystem/iconGroups/iconConstants';
import { useDebouncedFunction } from '../../../../../../store/hooks';
import {
  changeFormatOfOutputList,
  TriggeredBy,
  verifyAddress
} from '../../../../../../store/hooks/flows';
import {
  useConnection,
  useCurrentCoin,
  useCustomAccountContext,
  useNetwork,
  useSelectedWallet,
  useSendTransactionContext,
  useTokenContext
} from '../../../../../../store/provider';
import formatDisplayAmount from '../../../../../../utils/formatDisplayAmount';
import logger from '../../../../../../utils/logger';
import getFees from '../../../../../../utils/networkFees';
import Input from '../formComponents/Input';
import CustomSlider from '../generalComponents/CustomSlider';
import LabelText from '../generalComponents/LabelText';

import {
  BatchRecipientData,
  BatchRecipientPropType,
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'WalletSendRecipient';

const classes = {
  root: `${PREFIX}-root`,
  button: `${PREFIX}-button`,
  active: `${PREFIX}-active`,
  buttonGroup: `${PREFIX}-buttonGroup`,
  singleTransaction: `${PREFIX}-singleTransaction`,
  batchTransaction: `${PREFIX}-batchTransaction`,
  networkFees: `${PREFIX}-networkFees`,
  networkLabel: `${PREFIX}-networkLabel`,
  networkButton: `${PREFIX}-networkButton`,
  batchDustbin: `${PREFIX}-batchDustbin`,
  divider: `${PREFIX}-divider`,
  recipientFooter: `${PREFIX}-recipientFooter`,
  recipientTotal: `${PREFIX}-recipientTotal`,
  recipientContinueButton: `${PREFIX}-recipientContinueButton`,
  sendMaxBtn: `${PREFIX}-sendMaxBtn`,
  sendMaxBtnActive: `${PREFIX}-sendMaxBtnActive`,
  amountUSD: `${PREFIX}-amountUSD`,
  feeUnit: `${PREFIX}-feeUnit`,
  center: `${PREFIX}-center`,
  manualFeeErrorInfo: `${PREFIX}-manualFeeErrorInfo`,
  sliderFeeErrorInfo: `${PREFIX}-sliderFeeErrorInfo`,
  extras: `${PREFIX}-extras`,
  primaryColor: `${PREFIX}-primaryColor`,
  dangerColor: `${PREFIX}-dangerColor`,
  infoIcon: `${PREFIX}-infoIcon`
};

const Root = styled(Grid)(({ theme }) => ({
  [`&.${classes.root}`]: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: '1rem'
  },
  [`& .${classes.button}`]: {
    color: theme.palette.text.secondary,
    background: '#131619',
    textTransform: 'none',
    fontSize: '0.9rem',
    fontWeight: 400,
    borderLeft: `1px solid ${theme.palette.primary.light}`
  },
  [`& .${classes.active}`]: {
    border: `1px solid ${theme.palette.secondary.dark} !important`,
    fontWeight: 600,
    color: theme.palette.text.primary,
    letterSpacing: '1px',
    zIndex: 1
  },
  [`& .${classes.buttonGroup}`]: {
    border: `1px solid ${theme.palette.primary.light}`
  },
  [`& .${classes.singleTransaction}`]: {
    width: '80%'
  },
  [`& .${classes.batchTransaction}`]: {
    width: '80%'
  },
  [`& .${classes.networkFees}`]: {
    width: '80%',
    marginTop: 30,
    marginBottom: 35
  },
  [`& .${classes.networkLabel}`]: {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.primary.light,
    fontSize: '0.9rem',
    marginBottom: 20,
    padding: '0rem 0.5rem',
    '& .text': {
      marginRight: 20
    }
  },
  [`& .${classes.networkButton}`]: {
    textTransform: 'none',
    color: theme.palette.secondary.main,
    padding: 0,
    height: 20,
    fontSize: '0.7rem'
  },
  [`& .${classes.batchDustbin}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: '1rem !important'
  },
  [`& .${classes.divider}`]: {
    width: '100%',
    borderTop: `1px solid ${theme.palette.text.secondary}`
  },
  [`& .${classes.recipientFooter}`]: {
    display: 'flex',
    alignItems: 'center',
    width: '85%',
    justifyContent: 'space-between'
  },
  [`& .${classes.recipientTotal}`]: {
    display: 'flex',
    minWidth: '200px',
    marginTop: 20,
    flexDirection: 'column',
    '& span': {
      color: theme.palette.secondary.light,
      fontSize: '0.7rem'
    },
    '& .amount': {
      color: theme.palette.secondary.main,
      fontSize: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      '& .amountCurrency': {
        marginLeft: '5px',
        fontSize: '1rem'
      }
    }
  },
  ['& .amountCurrency']: {
    marginLeft: '5px',
    fontSize: '1rem'
  },
  [`& .${classes.recipientContinueButton}`]: {
    padding: '1rem 4rem',
    marginTop: 15
  },
  [`& .${classes.sendMaxBtn}`]: {
    width: '100px',
    border: '1px solid #696969',
    color: theme.palette.secondary.main,
    marginBottom: '5px'
  },
  [`& .${classes.sendMaxBtnActive}`]: {
    background: 'rgba(255, 255, 255, 0.2)'
  },
  [`& .${classes.amountUSD}`]: {
    marginLeft: '1rem',
    color: theme.palette.info.light
  },
  [`& .${classes.feeUnit}`]: {
    textAlign: 'center',
    color: theme.palette.info.light
  },
  [`&.${classes.center}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  [`& .${classes.center}`]: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  [`& .${classes.manualFeeErrorInfo}`]: {
    marginTop: '5px'
  },
  [`& .${classes.sliderFeeErrorInfo}`]: {
    marginTop: '20px'
  },
  [`&.${classes.extras}`]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '0.5rem 0rem',
    marginLeft: -10
  },
  [`& .${classes.primaryColor}`]: {
    color: theme.palette.secondary.dark
  },
  [`& .${classes.dangerColor}`]: {
    color: theme.palette.error.dark
  },
  [`& .${classes.infoIcon}`]: {
    fontSize: '12px',
    color: '#ADABAA'
  }
}));

type BatchRecipientProps = {
  handleDelete: (e: any) => void;
  handleChange: (e: any) => void;
  id: string | undefined;
  recipient: BatchRecipientData;
  coinAbbr: string;
  coinId: string;
  handleCopyFromClipboard: (id: string) => void;
  index: number;
  allowDelete: boolean;
  handleKeyPress: (e: any) => void;
};

const BatchRecipient: React.FC<BatchRecipientProps> = props => {
  const dustbinStyles = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: '1.8rem'
  };
  const {
    id,
    handleChange,
    handleDelete,
    recipient,
    coinId,
    handleCopyFromClipboard,
    index,
    allowDelete,
    handleKeyPress
  } = props;
  const coin = COINS[coinId];
  if (!coin) throw new Error(`Cannot find coinId: ${coinId}`);
  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Input
          onKeyDown={handleKeyPress}
          id={id}
          name="reciever_addr"
          label={`Recipient's Address ${index}`}
          value={recipient.recipient}
          error={recipient.errorRecipient.length !== 0}
          helperText={
            recipient.errorRecipient.length !== 0
              ? recipient.errorRecipient
              : undefined
          }
          onChange={handleChange}
          isClipboardPresent
          handleCopyFromClipboard={handleCopyFromClipboard}
        />
      </Grid>
      <Grid item xs={5}>
        <Input
          onKeyDown={handleKeyPress}
          id={id}
          name="amount"
          label="Amount"
          type="number"
          value={recipient.amount}
          error={!!recipient.errorAmount}
          helperText={recipient.errorAmount}
          onChange={handleChange}
          decimal={coin.decimal}
          customIconStyle={{ height: '24px', padding: '12px' }}
        />
      </Grid>
      {allowDelete && (
        <Grid item xs={1} style={dustbinStyles}>
          <CustomIconButton
            onClick={() => {
              handleDelete(props);
            }}
            title="Delete Recipient"
          >
            <Icon
              size={24}
              viewBox="0 0 20 24"
              iconGroup={
                <g>
                  <path
                    d="M12.9982 9.15283C12.7047 9.15283 12.4668 9.39071 12.4668 9.68423V19.7276C12.4668 20.0209 12.7047 20.2589 12.9982 20.2589C13.2917 20.2589 13.5296 20.0209 13.5296 19.7276V9.68423C13.5296 9.39071 13.2917 9.15283 12.9982 9.15283Z"
                    fill="#DF2D2D"
                  />
                  <path
                    d="M6.72768 9.15283C6.43417 9.15283 6.19629 9.39071 6.19629 9.68423V19.7276C6.19629 20.0209 6.43417 20.2589 6.72768 20.2589C7.02119 20.2589 7.25908 20.0209 7.25908 19.7276V9.68423C7.25908 9.39071 7.02119 9.15283 6.72768 9.15283Z"
                    fill="#DF2D2D"
                  />
                  <path
                    d="M2.15768 7.68779V20.7802C2.15768 21.554 2.44143 22.2807 2.93712 22.8021C3.43053 23.325 4.11718 23.6219 4.83581 23.6231H14.8899C15.6087 23.6219 16.2954 23.325 16.7886 22.8021C17.2843 22.2807 17.568 21.554 17.568 20.7802V7.68779C18.5534 7.42625 19.1919 6.47431 19.0601 5.46321C18.9281 4.45233 18.0668 3.69613 17.0472 3.69592H14.3265V3.03168C14.3297 2.4731 14.1088 1.93673 13.7134 1.54213C13.3179 1.14773 12.7807 0.92812 12.2222 0.932687H7.50356C6.94498 0.92812 6.40777 1.14773 6.01234 1.54213C5.61691 1.93673 5.39605 2.4731 5.39917 3.03168V3.69592H2.67848C1.65887 3.69613 0.797646 4.45233 0.665628 5.46321C0.533818 6.47431 1.17232 7.42625 2.15768 7.68779ZM14.8899 22.5603H4.83581C3.92725 22.5603 3.22046 21.7798 3.22046 20.7802V7.7345H16.5053V20.7802C16.5053 21.7798 15.7985 22.5603 14.8899 22.5603ZM6.46195 3.03168C6.45842 2.75499 6.56719 2.48867 6.76356 2.29334C6.95971 2.09801 7.22666 1.9907 7.50356 1.99547H12.2222C12.4991 1.9907 12.766 2.09801 12.9622 2.29334C13.1585 2.48846 13.2673 2.75499 13.2638 3.03168V3.69592H6.46195V3.03168ZM2.67848 4.75871H17.0472C17.5755 4.75871 18.0037 5.18693 18.0037 5.71521C18.0037 6.24349 17.5755 6.67171 17.0472 6.67171H2.67848C2.1502 6.67171 1.72198 6.24349 1.72198 5.71521C1.72198 5.18693 2.1502 4.75871 2.67848 4.75871Z"
                    fill="#DF2D2D"
                  />
                  <path
                    d="M9.8644 9.15283C9.57089 9.15283 9.33301 9.39071 9.33301 9.68423V19.7276C9.33301 20.0209 9.57089 20.2589 9.8644 20.2589C10.1579 20.2589 10.3958 20.0209 10.3958 19.7276V9.68423C10.3958 9.39071 10.1579 9.15283 9.8644 9.15283Z"
                    fill="#DF2D2D"
                  />
                </g>
              }
            />
          </CustomIconButton>
        </Grid>
      )}
    </Grid>
  );
};

const CustomAlert = withStyles((theme: Theme) =>
  createStyles({
    filledWarning: {
      backgroundColor: '#E19A4C',
      color: theme.palette.primary.main
    }
  })
)(Alert);

BatchRecipient.propTypes = {
  handleDelete: PropTypes.func.isRequired,
  handleChange: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  recipient: PropTypes.exact(BatchRecipientPropType),
  coinAbbr: PropTypes.string.isRequired,
  handleCopyFromClipboard: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  allowDelete: PropTypes.bool.isRequired,
  handleKeyPress: PropTypes.func.isRequired
};

const Recipient: React.FC<StepComponentProps> = props => {
  const {
    batchRecipientData,
    activeButton,
    changeButton,
    handleVerificationErrors,
    validateInputs,
    transactionFee,
    maxSend,
    setMaxSend,
    handleInputChange,
    handleCopyFromClipboard,
    setTransactionFee,
    gasLimit,
    l1Cost,
    setGasLimit,
    gasLimitError,
    handleNext,
    handleDelete,
    feeType,
    handleFeeType,
    handleTransactionFeeChangeSlider,
    handleTransactionFeeChange,
    total,
    buttonDisabled,
    addBatchTransaction,
    isButtonLoading,
    estimateGasLimit,
    setEstimateGasLimit,
    duplicateBatchAddresses,
    addbatchRecipientData,
    txnParams,
    resultType,
    triggeredBy
  } = props;
  const {
    active,
    batchTransaction,
    button,
    buttonGroup,
    divider,
    networkFees,
    networkLabel,
    recipientContinueButton,
    recipientFooter,
    recipientTotal,
    root,
    singleTransaction,
    amountUSD
  } = classes;

  const initialTransactionFeesSet = React.useRef(false);
  const { coinDetails } = useCurrentCoin();
  const isBtcFork = COINS[coinDetails.coinId]?.group === CoinGroup.BitcoinForks;
  const { customAccount } = useCustomAccountContext();

  const {
    selectedWallet: { passwordSet, passphraseSet, _id }
  } = useSelectedWallet();

  const { token } = useTokenContext();

  const coin = token
    ? COINS[coinDetails.coinId]?.tokenList[token.coinId]
    : COINS[coinDetails.coinId];
  const coinAbbr = coin.abbr;
  const coinPrice = token ? token.displayPrice : coinDetails.displayPrice;

  const { sendTransaction } = useSendTransactionContext();

  const { deviceConnection, deviceSdkVersion, beforeFlowStart, setIsInFlow } =
    useConnection();

  const floatTransactionFee = parseFloat(transactionFee) || 0;
  const [mediumFee, setMediumFee] = useState(floatTransactionFee);
  const [isMediumFeeLoading, setIsMediumFeeLoading] = useState(false);
  const [mediumFeeError, setMediumFeeError] = useState(false);
  const [walletConnectSupported, setWalletConnectSupported] = useState(false);

  const { connected } = useNetwork();

  useEffect(() => {
    if (deviceSdkVersion)
      setWalletConnectSupported(
        isFeatureEnabled(FeatureName.WalletConnectSupport, deviceSdkVersion)
      );
  }, [deviceSdkVersion]);

  // Used to get previous mediumFee for the coin from localStorage
  const getPreviousMedimFee = () => {
    const prevInfoJSON = localStorage.getItem('mediumFees');
    let prevInfo: Record<any, any> = {};

    if (prevInfoJSON !== null) {
      try {
        prevInfo = JSON.parse(prevInfoJSON);
      } catch (error) {
        prevInfo = {};
      }
    }

    return prevInfo[coinDetails.coinId];
  };

  // TODO: This parameter should be dynamic as it depends on the coin and network congestion
  const lowFeePercentage = 0.5;

  // Stores mediumFee for the coin in localStorage
  const storeCurrentMedimFee = (fees: number) => {
    const prevInfoJSON = localStorage.getItem('mediumFees');
    let prevInfo: Record<any, any> = {};

    if (prevInfoJSON !== null) {
      try {
        prevInfo = JSON.parse(prevInfoJSON);
      } catch (error) {
        prevInfo = {};
      }
    }

    prevInfo[coinDetails.coinId] = fees;
    localStorage.setItem('mediumFees', JSON.stringify(prevInfo));
  };

  useEffect(() => {
    setIsMediumFeeLoading(true);
    getFees(coinDetails.coinId)
      .then(res => {
        logger.info(`Medium Fee is ${res}`);
        setMediumFee(res);
        if (!initialTransactionFeesSet.current) {
          initialTransactionFeesSet.current = true;
          setTransactionFee(res);
        }
        storeCurrentMedimFee(res);
      })
      .catch(e => {
        logger.error('Error in fetching medium fee');
        logger.error(e);
        setMediumFeeError(true);
        // When error, try to use previous medium fee
        const prevFee = getPreviousMedimFee();
        if (prevFee) {
          setMediumFee(prevFee);
          if (!initialTransactionFeesSet.current) {
            initialTransactionFeesSet.current = true;
            setTransactionFee(prevFee);
          }
        }
      })
      .finally(() => {
        setIsMediumFeeLoading(false);
      });
  }, []);

  let validatedAddresses: any[any] = [];

  const isEthereum = COINS[coinDetails.coinId].group === CoinGroup.Ethereum;
  const isNear = COINS[coinDetails.coinId].group === CoinGroup.Near;
  const isSolana = COINS[coinDetails.coinId].group === CoinGroup.Solana;
  const isBtc = COINS[coinDetails.coinId].group === CoinGroup.BitcoinForks;

  const handleCheckAddresses = async (skipEmpty = false) => {
    let isValid = true;
    validatedAddresses = [];

    for (const recipient of batchRecipientData) {
      const { recipient: recipient1, id } = recipient;

      let addressValid;
      if (skipEmpty && recipient1.trim().length === 0) addressValid = true;
      else addressValid = verifyAddress(recipient1.trim(), coinDetails);

      if (!addressValid) {
        isValid = false;
      }
      validatedAddresses.push([id, recipient1.trim(), addressValid]);
    }

    for (const data of validatedAddresses) {
      let nearAccExistsError: string | undefined;
      if (data[2]) nearAccExistsError = await checkNearAccount(data[1]);
      if (nearAccExistsError) isValid = isValid && false;
      handleVerificationErrors(data[0], data[1], data[2], nearAccExistsError);
    }
    return isValid;
  };

  const debouncedHandleCheckAddresses = useDebouncedFunction(
    () => handleCheckAddresses(true),
    200
  );

  useEffect(() => {
    if (connected) debouncedHandleCheckAddresses();
  }, [connected]);

  const checkNearAccount = async (address: string) => {
    const coinObj = COINS[coinDetails.coinId];
    if (coinObj instanceof NearCoinData) {
      if (address.length === 64) return undefined;
      const wallet = new NearWallet(
        coinDetails.accountIndex,
        coinDetails.xpub,
        coinObj
      );
      const check = await wallet.getTotalBalanceCustom(address);
      if (check.balance === undefined) {
        return "This account dosen't exists";
      }
    }
    return undefined;
  };

  const handleRecipientSubmit = async () => {
    const isValid = await handleCheckAddresses();
    const isInputsValid = validateInputs();
    if (isValid && isInputsValid) {
      if (!beforeFlowStart()) {
        return;
      }

      let contractAddress: string | undefined;
      if (token) {
        const tokenData = COINS[token.parentCoinId].tokenList[token.coinId];
        contractAddress = tokenData.address;
      }

      sendTransaction.handleSendTransaction({
        connection: deviceConnection,
        sdkVersion: deviceSdkVersion,
        setIsInFlow,
        walletId: _id,
        pinExists: passwordSet,
        passphraseExists: passphraseSet,
        xpub: coinDetails.xpub,
        customAccount: customAccount?.name,
        newAccountId: null,
        coinId: coinDetails.coinId,
        accountId: coinDetails.accountId,
        accountIndex: coinDetails.accountIndex,
        accountType: coinDetails.accountType,
        outputList: changeFormatOfOutputList(
          batchRecipientData,
          coinDetails.coinId,
          token?.coinId
        ),
        // rounding the data to handle decimals for now
        // TODO: Need to figure out support everywhere properly
        fees: floatTransactionFee,
        isSendAll: maxSend,
        data: {
          gasLimit,
          l1Cost,
          contractAddress,
          contractAbbr: token ? coinAbbr.toUpperCase() : undefined,
          nonce: txnParams?.nonce,
          contractData: txnParams?.data,
          subCoinId: token?.coinId
        },
        onlySignature: resultType && resultType === 'signature',
        triggeredBy
      });
      handleNext();
    }
  };

  const ENTER_KEY = 13;
  const handleKeyPress = (event: any) => {
    if (
      buttonDisabled ||
      isButtonLoading ||
      sendTransaction.estimationError !== undefined ||
      !connected
    ) {
      return;
    }
    if (event.keyCode === ENTER_KEY) {
      handleRecipientSubmit();
    }
  };

  const getSkeletonForFee = () => {
    if (
      isMediumFeeLoading ||
      sendTransaction.isEstimatingFees ||
      isButtonLoading
    )
      return <Skeleton width={'100px'} />;
  };

  const getFeeErrorInfo = () => {
    return (
      <div
        className={clsx({
          [classes.center]: true,
          [classes.sliderFeeErrorInfo]: feeType,
          [classes.manualFeeErrorInfo]: !feeType
        })}
      >
        <AlertIcon
          className={classes.primaryColor}
          style={{ marginRight: '5px' }}
        />
        <Typography variant="body2" color="textSecondary" align="center">
          Unable to fetch the latest average fee
        </Typography>
      </div>
    );
  };

  const getFeeInput = () => {
    if (isMediumFeeLoading) {
      return (
        <Root className={classes.center}>
          <CircularProgress color="secondary" />
        </Root>
      );
    }

    if (feeType) {
      return (
        <>
          <CustomSlider
            handleTransactionFeeChangeSlider={handleTransactionFeeChangeSlider}
            mediumFee={mediumFee}
            fee={floatTransactionFee}
            step={isBtcFork ? 1 : undefined}
          />
          {mediumFeeError && getFeeErrorInfo()}
        </>
      );
    }

    return (
      <>
        <Input
          onKeyDown={handleKeyPress}
          placeHolder="Enter transaction fee"
          onChange={handleTransactionFeeChange}
          type="number"
          value={transactionFee}
          customIcon={
            <Typography className={classes.feeUnit}>
              {COINS[coinDetails.coinId]?.fees}
            </Typography>
          }
        />
        {mediumFeeError && getFeeErrorInfo()}
      </>
    );
  };

  const getDuplicateWarning = (id: string) => {
    if (duplicateBatchAddresses.includes(id)) {
      return (
        <Root
          container
          className={classes.extras}
          style={{ marginLeft: '0' }}
          wrap="nowrap"
        >
          <AlertIcon
            className={classes.primaryColor}
            style={{ marginRight: '5px' }}
          />
          <Typography color="secondary">
            This address is already present
          </Typography>
        </Root>
      );
    }
    return <></>;
  };

  useEffect(() => {
    if (txnParams) {
      const dataCopy = batchRecipientData.map((elem, index) => {
        if (index === 0) {
          if (txnParams.to) {
            elem.recipient = txnParams.to;
          }

          if (txnParams.value) {
            const value = new BigNumber(txnParams.value, 16);
            elem.amount = value
              .dividedBy(COINS[coinDetails.coinId].multiplier)
              .toString();
          }
        }

        return elem;
      });

      if (txnParams.gas) {
        const value = parseInt(txnParams.gas, 16);
        if (value) {
          setGasLimit(value);
        }
      }

      if (txnParams.gasPrice) {
        const value = new BigNumber(txnParams.gasPrice, 16)
          .dividedBy(1_000_000_000)
          .toNumber();
        if (value) {
          initialTransactionFeesSet.current = true;
          setTransactionFee(value);
        }
      }

      addbatchRecipientData([...dataCopy]);
    }
  }, [txnParams]);

  return (
    <Root container className={root}>
      {txnParams?.data && (
        <CustomAlert severity="warning" variant="filled" color="warning">
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div> This transaction contains contract data </div>
          </div>
        </CustomAlert>
      )}
      {isBtc && (
        <ButtonGroup
          disableElevation
          aria-label="outlined secondary button group"
          className={buttonGroup}
        >
          <Tooltip title="Send coins to a single recipient">
            <Button
              variant="outlined"
              className={clsx({ [button]: true, [active]: activeButton === 0 })}
              onClick={() => changeButton(0)}
            >
              Single Transaction
            </Button>
          </Tooltip>
          <Tooltip title="Send coins to multiple recipients">
            <Button
              variant="outlined"
              className={clsx({ [button]: true, [active]: activeButton === 1 })}
              onClick={() => changeButton(1)}
            >
              Batch Transaction
            </Button>
          </Tooltip>
        </ButtonGroup>
      )}

      {activeButton === 0 ? (
        <div className={singleTransaction}>
          <Input
            onKeyDown={handleKeyPress}
            name="reciever_addr"
            id="1"
            label="Recipient's Address"
            onChange={e => {
              handleInputChange(e);
              debouncedHandleCheckAddresses();
            }}
            disabled={!!txnParams?.to}
            value={batchRecipientData[0].recipient}
            error={batchRecipientData[0].errorRecipient.length !== 0}
            helperText={
              batchRecipientData[0].errorRecipient.length !== 0
                ? batchRecipientData[0].errorRecipient
                : undefined
            }
            isClipboardPresent={!txnParams?.to}
            handleCopyFromClipboard={e => {
              handleCopyFromClipboard(e);
              debouncedHandleCheckAddresses();
            }}
          />
          {(triggeredBy !== TriggeredBy.WalletConnect ||
            parseInt(batchRecipientData[0].amount, 10) !== 0) && (
            <>
              <Input
                onKeyDown={handleKeyPress}
                id="1"
                name="amount"
                type="number"
                label={`Amount ${coinAbbr.toUpperCase()}`}
                onChange={handleInputChange}
                value={
                  !maxSend
                    ? batchRecipientData[0].amount
                    : sendTransaction.sendMaxAmount
                }
                showLoading={maxSend && sendTransaction.isEstimatingFees}
                error={!!batchRecipientData[0].errorAmount}
                helperText={batchRecipientData[0].errorAmount}
                placeHolder="0"
                decimal={coin.decimal}
                disabled={txnParams?.value !== undefined || maxSend}
                customIcon={
                  txnParams?.value === undefined ? (
                    <Button
                      className={`${classes.sendMaxBtn} ${
                        maxSend ? classes.sendMaxBtnActive : ''
                      }`}
                      onClick={() => setMaxSend(!maxSend)}
                    >
                      Send Max
                    </Button>
                  ) : (
                    <></>
                  )
                }
              />
              <Typography className={amountUSD}>
                {' '}
                ~( $
                {formatDisplayAmount(
                  total.multipliedBy(new BigNumber(coinPrice)),
                  2,
                  true
                )}
                )
              </Typography>
            </>
          )}
          {customAccount && (
            <div style={{ marginTop: '5px', padding: '0.2rem 0.5rem' }}>
              <LabelText
                label="Your Account ID"
                text={customAccount.name}
                verified={sendTransaction.verified}
              />
            </div>
          )}
          {(isNear || isSolana) && <div style={{ marginBottom: '10px' }} />}
          {isEthereum && (
            <div style={{ marginTop: '10px' }}>
              <FormControlLabel
                style={{ marginLeft: '0' }}
                control={
                  <Checkbox
                    checked={estimateGasLimit}
                    onChange={(_, checked: boolean) => {
                      setEstimateGasLimit(checked);
                    }}
                    name="Estimate Gas Limit"
                    color="secondary"
                  />
                }
                label="Automatically estimate gas limit"
              />

              <Input
                onKeyDown={handleKeyPress}
                id="1"
                name="gaslimit"
                type="number"
                label="Gas Limit"
                value={gasLimit}
                onChange={e => {
                  setGasLimit(e.target.value);
                }}
                error={!!gasLimitError}
                helperText={gasLimitError}
                disabled={estimateGasLimit}
              />
            </div>
          )}
        </div>
      ) : (
        <Grid container spacing={2} className={batchTransaction}>
          <Grid item xs={12}>
            {batchRecipientData.map((recipient: any, index) => {
              return (
                <div key={recipient.id}>
                  <BatchRecipient
                    coinId={coinDetails.coinId}
                    handleKeyPress={handleKeyPress}
                    handleDelete={handleDelete}
                    handleChange={e => {
                      handleInputChange(e);
                      debouncedHandleCheckAddresses();
                    }}
                    id={recipient.id.toString()}
                    recipient={recipient}
                    handleCopyFromClipboard={e => {
                      handleCopyFromClipboard(e);
                      debouncedHandleCheckAddresses();
                    }}
                    coinAbbr={coinAbbr}
                    index={index + 1}
                    allowDelete={batchRecipientData.length > 1}
                  />
                  {getDuplicateWarning(recipient.id.toString())}
                </div>
              );
            })}
          </Grid>
          <Grid item xs={12}>
            <CustomButton
              fullWidth
              startIcon={
                <Icon
                  size={14}
                  color="#fff"
                  viewBox="0 0 9 9"
                  icon={ICONS.add}
                />
              }
              onClick={addBatchTransaction}
              style={{
                background: '#1E2328'
              }}
            >
              Add another recipient
            </CustomButton>
          </Grid>
        </Grid>
      )}
      {!isNear && !isSolana && (
        <div className={networkFees}>
          <div className={networkLabel}>
            <Typography className="text" color="textPrimary">
              {`Network Fee ${isEthereum ? '( Gas Price )' : ''} :`}
            </Typography>
            <SwitchButton completed={feeType} handleChange={handleFeeType} />
            <Typography color="secondary">
              {feeType ? 'Slider' : 'Manual'}
            </Typography>
          </div>
          {getFeeInput()}
          {floatTransactionFee < lowFeePercentage * mediumFee && (
            <div style={{ textAlign: 'center' }}>
              <Typography
                className="text"
                color="secondary"
                style={{ margin: 'auto', marginTop: '1.5rem' }}
              >
                <AlertIcon
                  className={classes.primaryColor}
                  style={{ marginRight: '5px', verticalAlign: 'bottom' }}
                />
                Transaction might be cancelled due to low fee
              </Typography>
            </div>
          )}
        </div>
      )}
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
      <div className={divider} />
      <div className={recipientFooter}>
        {sendTransaction.estimationError?.isSet && !isButtonLoading ? (
          <div
            className={classes.center}
            style={{ justifyContent: 'flex-start' }}
          >
            <AlertIcon
              className={classes.dangerColor}
              style={{ marginRight: '5px' }}
            />
            <Typography variant="body2" color="textSecondary" align="center">
              {sendTransaction.estimationError.getMessage()}
            </Typography>
          </div>
        ) : (
          <div className={recipientTotal}>
            <div>
              {coinDetails.coinId === EthCoinMap.optimism || (
                <Typography
                  variant="subtitle1"
                  color="secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%'
                  }}
                >
                  <small style={{ marginRight: '5px' }}>TRANSACTION FEE:</small>
                  {getSkeletonForFee() || (
                    <>
                      {` ~${formatDisplayAmount(
                        sendTransaction.approxTotalFee
                      )} `}
                      <span className="amountCurrency">
                        {COINS[coinDetails.coinId]?.abbr?.toUpperCase()}
                        &nbsp;&nbsp;&nbsp;
                      </span>
                      <span style={{ fontSize: '0.7rem' }}>
                        {`($${formatDisplayAmount(
                          sendTransaction.approxTotalFee *
                            parseFloat(coinDetails.displayPrice),
                          2,
                          true
                        )})`}
                      </span>
                    </>
                  )}
                </Typography>
              )}
              {coinDetails.coinId === EthCoinMap.optimism && (
                <>
                  <Typography
                    variant="subtitle1"
                    color="secondary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%'
                    }}
                  >
                    <small style={{ marginRight: '5px' }}>
                      TRANSACTION FEE:
                    </small>
                    {getSkeletonForFee() || (
                      <>
                        {` ~${formatDisplayAmount(sendTransaction.l2Fee)} `}
                        <span className="amountCurrency">
                          {COINS[coinDetails.coinId]?.abbr?.toUpperCase()}
                          &nbsp;&nbsp;&nbsp;
                        </span>
                        <span style={{ fontSize: '0.7rem' }}>
                          {`($${formatDisplayAmount(
                            parseFloat(sendTransaction.l2Fee) *
                              parseFloat(coinDetails.displayPrice),
                            2,
                            true
                          )})`}
                        </span>
                      </>
                    )}
                  </Typography>
                  {sendTransaction.l1Fee !== '0' && (
                    <Typography
                      variant="subtitle1"
                      color="secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%'
                      }}
                    >
                      <small style={{ marginRight: '5px' }}>L1 DATA FEE:</small>
                      {getSkeletonForFee() || (
                        <>
                          {` ~${formatDisplayAmount(sendTransaction.l1Fee)} `}
                          <span className="amountCurrency">
                            {COINS[coinDetails.coinId]?.abbr?.toUpperCase()}
                            &nbsp;&nbsp;&nbsp;
                          </span>
                          <span
                            style={{ fontSize: '0.7rem', marginRight: '5px' }}
                          >
                            {`($${formatDisplayAmount(
                              parseFloat(sendTransaction.l1Fee) *
                                parseFloat(coinDetails.displayPrice),
                              2,
                              true
                            )})`}
                          </span>
                          <Tooltip title="L1 fees pay for the cost of publishing the transaction on L1. It is deducted automatically from the ETH balance on Optimistic Ethereum.">
                            <InfoIcon className={classes.infoIcon} />
                          </Tooltip>
                        </>
                      )}
                    </Typography>
                  )}
                </>
              )}
            </div>
            <Typography variant="caption" color="secondary">
              {token ? 'AMOUNT' : 'TOTAL'}
            </Typography>
            <Typography variant="caption" color="secondary" className="amount">
              {getSkeletonForFee() || (
                <>
                  {token
                    ? `${formatDisplayAmount(total)} `
                    : `${formatDisplayAmount(
                        total.plus(
                          new BigNumber(sendTransaction.approxTotalFee)
                        )
                      )} `}
                  <span className="amountCurrency">
                    {coinAbbr.toUpperCase()}
                    &nbsp;&nbsp;&nbsp;
                  </span>
                  <span style={{ fontSize: '1rem' }}>
                    {token
                      ? `(~ $${formatDisplayAmount(
                          total.multipliedBy(new BigNumber(token.displayPrice)),
                          2,
                          true
                        )})`
                      : `(~ $${formatDisplayAmount(
                          total
                            .plus(new BigNumber(sendTransaction.approxTotalFee))
                            .multipliedBy(
                              new BigNumber(coinDetails.displayPrice)
                            ),
                          2,
                          true
                        )})`}
                  </span>
                </>
              )}
            </Typography>
          </div>
        )}
        <Tooltip
          title={
            !deviceConnection
              ? 'Connect X1 Wallet'
              : !connected
              ? 'No internet connection available'
              : triggeredBy === TriggeredBy.WalletConnect &&
                !walletConnectSupported
              ? 'Update X1 Wallet to use this feature'
              : ''
          }
        >
          <div style={{ display: 'inline-block' }}>
            <CustomButton
              disabled={
                buttonDisabled ||
                isButtonLoading ||
                sendTransaction.estimationError !== undefined ||
                !deviceConnection ||
                !connected ||
                (triggeredBy === TriggeredBy.WalletConnect &&
                  !walletConnectSupported)
              }
              className={recipientContinueButton}
              onClick={() => {
                handleRecipientSubmit();
              }}
            >
              {isButtonLoading ? <CircularProgress size={25} /> : 'Continue'}
            </CustomButton>
          </div>
        </Tooltip>
      </div>
    </Root>
  );
};

Recipient.propTypes = StepComponentPropTypes;

export default Recipient;
