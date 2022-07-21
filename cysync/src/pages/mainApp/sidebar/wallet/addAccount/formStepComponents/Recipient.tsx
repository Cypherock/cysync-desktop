import {
  ALLCOINS,
  CoinGroup,
  COINS,
  Erc20CoinData,
  NearCoinData
} from '@cypherock/communication';
import { NearWallet } from '@cypherock/wallet';
import { Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import React from 'react';

import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import CustomIconButton from '../../../../../../designSystem/designComponents/buttons/customIconButton';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import Dustbin from '../../../../../../designSystem/iconGroups/dustbin';
import { useDebouncedFunction } from '../../../../../../store/hooks';
import {
  changeFormatOfOutputList,
  verifyAddress
} from '../../../../../../store/hooks/flows';
import {
  useConnection,
  useCurrentCoin,
  useCustomAccountContext,
  useSelectedWallet,
  useSendTransactionContext,
  useTokenContext
} from '../../../../../../store/provider';
import Input from '../formComponents/Input';

import {
  BatchRecipientPropType,
  RecipientData,
  StepComponentProps,
  StepComponentPropTypes
} from './StepComponentProps';

const PREFIX = 'WalletAddAccountRecipient';

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
  center: `${PREFIX}-center`,
  manualFeeErrorInfo: `${PREFIX}-manualFeeErrorInfo`,
  sliderFeeErrorInfo: `${PREFIX}-sliderFeeErrorInfo`,
  extras: `${PREFIX}-extras`,
  primaryColor: `${PREFIX}-primaryColor`,
  dangerColor: `${PREFIX}-dangerColor`,
  info: `${PREFIX}-info`
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
    justifyContent: 'end'
  },
  [`& .${classes.recipientTotal}`]: {
    display: 'flex',
    marginTop: 20,
    flexDirection: 'column',
    '& span': {
      color: theme.palette.secondary.light,
      fontSize: '0.7rem'
    },
    '& .amount': {
      color: theme.palette.secondary.main,
      fontSize: '1.5rem',
      '& .amountCurrency': {
        fontSize: '1rem'
      }
    }
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
  [`& .${classes.info}`]: {
    padding: '10px 0px 20px',
    fontSize: '13px',
    color: theme.palette.info
  }
}));

type BatchRecipientProps = {
  handleDelete: (e: any) => void;
  handleChange: (e: any) => void;
  id: string | undefined;
  recipient: RecipientData;
  coinAbbr: string;
  handleCopyFromClipboard: (id: string) => void;
  index: number;
  allowDelete: boolean;
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
    coinAbbr,
    handleCopyFromClipboard,
    index,
    allowDelete
  } = props;
  const coin = ALLCOINS[coinAbbr];
  if (!coin) throw new Error(`Cannot find coinType: ${coinAbbr}`);
  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Input
          id={id}
          name="reciever_addr"
          label={`Receiver's Address ${index}`}
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
            <Icon size={24} viewBox="0 0 20 24" iconGroup={<Dustbin />} />
          </CustomIconButton>
        </Grid>
      )}
    </Grid>
  );
};

BatchRecipient.propTypes = {
  handleDelete: PropTypes.func.isRequired,
  handleChange: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  recipient: PropTypes.exact(BatchRecipientPropType),
  coinAbbr: PropTypes.string.isRequired,
  handleCopyFromClipboard: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  allowDelete: PropTypes.bool.isRequired
};

const Recipient: React.FC<StepComponentProps> = props => {
  const {
    recipientData,
    handleVerificationErrors,
    transactionFee,
    maxSend,
    handleInputChange,
    handleCopyFromClipboard,
    gasLimit,
    handleNext,
    buttonDisabled,
    isButtonLoading
  } = props;
  const {
    divider,
    recipientContinueButton,
    recipientFooter,
    root,
    singleTransaction
  } = classes;

  const { coinDetails } = useCurrentCoin();
  const { customAccount } = useCustomAccountContext();

  const {
    selectedWallet: { passwordSet, passphraseSet, _id }
  } = useSelectedWallet();

  const { token } = useTokenContext();

  const coinAbbr = token ? token.slug : coinDetails.slug;

  const { sendTransaction } = useSendTransactionContext();

  const { deviceConnection, deviceSdkVersion, beforeFlowStart, setIsInFlow } =
    useConnection();

  const intTransactionFee = parseInt(transactionFee, 10) || 0;

  // Used to get previous mediumFee for the coin from localStorage

  let validatedAddresses: any[any] = [];

  const isEthereum = COINS[coinDetails.slug].group === CoinGroup.Ethereum;
  // const isNear = COINS[coinDetails.slug].group === CoinGroup.Near;

  const handleCheckAddresses = async (skipEmpty = false) => {
    let isValid = true;
    validatedAddresses = [];

    for (const recipient of recipientData) {
      const { recipient: recipient1, id } = recipient;
      let { slug } = coinDetails;
      if (isEthereum) {
        slug = 'eth';
      }

      let addressValid;
      if (skipEmpty && recipient1.trim().length === 0) addressValid = true;
      else addressValid = verifyAddress(recipient1.trim(), slug);

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
  const checkNearAccount = async (address: string) => {
    const coin = COINS[coinDetails.slug];
    if (coin instanceof NearCoinData) {
      const wallet = new NearWallet(coinDetails.xpub, coin);
      const check = await wallet.getTotalBalanceCustom(address);
      if (!check.balance.cysyncError) {
        return 'This account already exists';
      } else if (check.balance.cysyncError) {
        return undefined;
      }
    }
    return undefined;
  };

  const handleRecipientSubmit = async () => {
    const isValid = await handleCheckAddresses();
    const isAmountValid = true;

    if (isValid && isAmountValid) {
      if (!beforeFlowStart()) {
        return;
      }

      const coin = ALLCOINS[coinAbbr];
      let contractAddress: string | undefined;
      if (token && coin instanceof Erc20CoinData) {
        contractAddress = coin.address;
      }

      sendTransaction.handleSendTransaction({
        connection: deviceConnection,
        sdkVersion: deviceSdkVersion,
        setIsInFlow,
        walletId: _id,
        pinExists: passwordSet,
        passphraseExists: passphraseSet,
        xpub: coinDetails.xpub,
        zpub: coinDetails.zpub,
        customAccount: customAccount?.name,
        newAccountId: recipientData[0].recipient,
        coinType: coinDetails.slug,
        outputList: changeFormatOfOutputList(
          recipientData,
          coinDetails.slug,
          token
        ),
        fees: intTransactionFee,
        isSendAll: maxSend,
        data: {
          gasLimit,
          contractAddress,
          contractAbbr: token ? coinAbbr.toUpperCase() : undefined
        }
      });
      handleNext();
    }
  };

  return (
    <Root container className={root}>
      <div className={singleTransaction}>
        <Input
          name="reciever_addr"
          id="1"
          label="New Account ID"
          placeHolder="accountid.testnet"
          onChange={e => {
            handleInputChange(e);
            debouncedHandleCheckAddresses();
          }}
          value={recipientData[0].recipient}
          error={recipientData[0].errorRecipient.length !== 0}
          helperText={
            recipientData[0].errorRecipient.length !== 0
              ? recipientData[0].errorRecipient
              : undefined
          }
          isClipboardPresent
          handleCopyFromClipboard={e => {
            handleCopyFromClipboard(e);
            debouncedHandleCheckAddresses();
          }}
        />
        <Typography className={classes.info}>
          <p>Your account ID can contain any of the following:</p>
          <ul>
            <li>Lowercase characters (a-z)</li>
            <li>Digits (0-9)</li>
            <li>Characters (_-) can be used as separators</li>
          </ul>
          <p>Your account ID CANNOT contain:</p>
          <ul>
            <li>Characters "@" or "."</li>
            <li>Fewer than 2 characters</li>
            <li>More than 64 characters (including .testnet)</li>
          </ul>
        </Typography>
      </div>
      <div className={divider} />
      <div className={recipientFooter}>
        <CustomButton
          disabled={
            buttonDisabled ||
            isButtonLoading ||
            sendTransaction.estimationError !== undefined
          }
          className={recipientContinueButton}
          onClick={() => {
            handleRecipientSubmit();
          }}
        >
          {isButtonLoading ? <CircularProgress size={25} /> : 'Add Account'}
        </CustomButton>
      </div>
    </Root>
  );
};

Recipient.propTypes = StepComponentPropTypes;

export default Recipient;