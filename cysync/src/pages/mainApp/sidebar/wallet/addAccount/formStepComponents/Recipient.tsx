import {
  ALLCOINS,
  CoinGroup,
  COINS,
  Erc20CoinData
} from '@cypherock/communication';
import { Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import React from 'react';

import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import CustomIconButton from '../../../../../../designSystem/designComponents/buttons/customIconButton';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
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
  BatchRecipientData,
  BatchRecipientPropType,
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
  recipient: BatchRecipientData;
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
    batchRecipientData,
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

  const handleCheckAddresses = (skipEmpty = false) => {
    let isValid = true;
    validatedAddresses = [];

    for (const recipient of batchRecipientData) {
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
      handleVerificationErrors(data[0], data[1], data[2]);
    }

    return isValid;
  };

  const handleRecipientSubmit = () => {
    const isValid = handleCheckAddresses();
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
        newAccountId: batchRecipientData[0].recipient,
        coinType: coinDetails.slug,
        outputList: changeFormatOfOutputList(
          batchRecipientData,
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
            handleCheckAddresses(true);
          }}
          value={batchRecipientData[0].recipient}
          error={batchRecipientData[0].errorRecipient.length !== 0}
          helperText={
            batchRecipientData[0].errorRecipient.length !== 0
              ? batchRecipientData[0].errorRecipient
              : undefined
          }
          isClipboardPresent
          handleCopyFromClipboard={e => {
            handleCopyFromClipboard(e);
            handleCheckAddresses(true);
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
