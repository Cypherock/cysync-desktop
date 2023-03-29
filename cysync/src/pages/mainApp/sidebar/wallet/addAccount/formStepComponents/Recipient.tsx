import { COINS, Erc20CoinData, NearCoinData } from '@cypherock/communication';
import { NearWallet } from '@cypherock/wallet';
import { Tooltip, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';

import CustomButton from '../../../../../../designSystem/designComponents/buttons/button';
import Icon from '../../../../../../designSystem/designComponents/icons/Icon';
import ErrorExclamation from '../../../../../../designSystem/iconGroups/errorExclamation';
import {
  useCustomAccount,
  useDebouncedFunction
} from '../../../../../../store/hooks';
import {
  changeFormatOfOutputList,
  verifyAddress
} from '../../../../../../store/hooks/flows';
import {
  useConnection,
  useCurrentCoin,
  useNetwork,
  useSelectedWallet,
  useSendTransactionContext,
  useTokenContext
} from '../../../../../../store/provider';
import Input from '../../send/formComponents/Input';

import {
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

const Recipient: React.FC<StepComponentProps> = props => {
  const {
    recipientData,
    handleVerificationErrors,
    creatorAccount,
    setCreatorAccount,
    transactionFee,
    handleInputChange,
    handleNext
  } = props;
  const {
    divider,
    recipientContinueButton,
    recipientFooter,
    root,
    singleTransaction
  } = classes;

  const { connected } = useNetwork();
  const { coinDetails } = useCurrentCoin();

  const {
    customAccountData,
    setCurrentAccountId,
    minimumBalanceForAddAccount
  } = useCustomAccount();

  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const coinNetwork = (COINS[coinDetails.coinId] as NearCoinData).network;
  const nearSuffix = coinNetwork === 'testnet' ? '.testnet' : '.near';

  const {
    selectedWallet: { passwordSet, passphraseSet, _id }
  } = useSelectedWallet();

  useEffect(() => {
    setCurrentAccountId(coinDetails.accountId);
  }, [coinDetails]);

  useEffect(() => {
    if (connected) debouncedHandleCheckAddresses();
  }, [connected]);

  useEffect(() => {
    if (customAccountData.length > 0) {
      setAvailableAccounts(
        customAccountData
          .filter(
            acc => parseFloat(acc.displayBalance) >= minimumBalanceForAddAccount
          )
          .map(({ name }) => name)
      );
    }
  }, [customAccountData]);

  useEffect(() => {
    if (availableAccounts.length > 0) {
      setCreatorAccount(availableAccounts[0]);
    }
  }, [availableAccounts]);

  const { token } = useTokenContext();

  const coinAbbr = token
    ? COINS[coinDetails.coinId]?.tokenList[token.coinId]?.abbr
    : COINS[coinDetails.coinId].abbr;

  const { sendTransaction } = useSendTransactionContext();

  const { deviceConnection, deviceSdkVersion, beforeFlowStart, setIsInFlow } =
    useConnection();

  const intTransactionFee = parseInt(transactionFee, 10) || 0;

  let validatedAddresses: any[any] = [];

  const handleCreatorAccountChange = (e: any) => {
    setCreatorAccount(e.target.value);
  };

  const handleCheckAddresses = async (skipEmpty = false) => {
    let isValid = true;
    validatedAddresses = [];

    for (const recipient of recipientData) {
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
  const checkNearAccount = async (address: string) => {
    const coin = COINS[coinDetails.coinId];
    if (coin instanceof NearCoinData) {
      if (address.includes('.')) return 'This is not a valid Near address';
      if ((address + nearSuffix).length > 64)
        return 'Near address cannot be more than 64 characters';
      const wallet = new NearWallet(
        coinDetails.accountIndex,
        coinDetails.xpub,
        coin
      );
      const check = await wallet.getTotalBalanceCustom(address + nearSuffix);
      if (check.balance !== undefined) {
        return 'This account already exists';
      }
    }
    return undefined;
  };

  const handleRecipientSubmit = async () => {
    const isValid = await handleCheckAddresses();

    if (isValid) {
      if (!beforeFlowStart()) {
        return;
      }

      const coin = COINS[coinAbbr];
      let contractAddress: string | undefined;
      if (token && coin instanceof Erc20CoinData) {
        contractAddress = coin.address;
      }

      sendTransaction.handleSendTransaction({
        accountId: coinDetails.accountId,
        accountIndex: coinDetails.accountIndex,
        accountType: coinDetails.accountType,
        coinId: coinDetails.coinId,
        connection: deviceConnection,
        sdkVersion: deviceSdkVersion,
        setIsInFlow,
        walletId: _id,
        pinExists: passwordSet,
        passphraseExists: passphraseSet,
        xpub: coinDetails.xpub,
        customAccount: creatorAccount,
        newAccountId: recipientData[0].recipient + nearSuffix,
        outputList: changeFormatOfOutputList(
          recipientData,
          coinDetails.coinId,
          token?.coinId
        ),
        fees: intTransactionFee,
        isSendAll: false,
        data: {
          gasLimit: 0,
          l1Cost: '0',
          contractAddress,
          contractAbbr: token ? coinAbbr.toUpperCase() : undefined,
          subCoinId: token?.coinId
        }
      });
      handleNext();
    }
  };

  return (
    <Root container className={root}>
      <div className={singleTransaction}>
        <Typography
          color="textSecondary"
          variant="h5"
          style={{ marginBottom: '0.5rem' }}
        >
          Create a new Account ID for NEAR
        </Typography>
        <Input
          name="creatorAccount"
          label="Create From"
          onChange={handleCreatorAccountChange}
          value={creatorAccount}
          items={availableAccounts}
          disabled={availableAccounts.length <= 1}
        />

        <Input
          name="reciever_addr"
          id="1"
          label="New Account ID"
          onChange={e => {
            handleInputChange(e);
            debouncedHandleCheckAddresses();
          }}
          value={recipientData[0].recipient.slice(0, 64 - nearSuffix.length)}
          error={recipientData[0].errorRecipient.length !== 0}
          helperText={
            recipientData[0].errorRecipient.length !== 0
              ? recipientData[0].errorRecipient
              : undefined
          }
          customIcon={<Typography>{nearSuffix}</Typography>}
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
            <li>More than 64 characters (including {nearSuffix})</li>
          </ul>
        </Typography>
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
      </div>
      <div className={divider} />
      <div className={recipientFooter}>
        <Tooltip title={connected ? '' : 'No internet connection available'}>
          <div style={{ display: 'inline-block' }}>
            <CustomButton
              className={recipientContinueButton}
              disabled={!connected}
              onClick={() => {
                handleRecipientSubmit();
              }}
            >
              {'Add Account'}
            </CustomButton>
          </div>
        </Tooltip>
      </div>
    </Root>
  );
};

Recipient.propTypes = StepComponentPropTypes;

export default Recipient;
