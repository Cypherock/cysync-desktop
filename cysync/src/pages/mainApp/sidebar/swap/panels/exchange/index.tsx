import { COINS } from '@cypherock/communication';
import { Wallet } from '@cypherock/database';
import { Grid, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';

import Button from '../../../../../../designSystem/designComponents/buttons/button';
import logger from '../../../../../../mainProcess/logger';
import { customAccountDb } from '../../../../../../store/database';
import {
  changeFormatOfOutputList,
  useExchange,
  useReceiveTransaction,
  useSendTransaction,
  useWalletData
} from '../../../../../../store/hooks';
import { useConnection, useWallets } from '../../../../../../store/provider';
import { RecipientData } from '../../../wallet/addAccount/formStepComponents/StepComponentProps';
import SwapCompletedDialog from '../dialogs/SwapCompletedDialog';
import VerifySwapDetailsDialog from '../dialogs/VerifySwapDetailsDialog';

import NetworkFeeDetails from './NetworkFeeDetails';
import SwapDetailsForm from './SwapDetailsForm';

const PREFIX = 'ExchangePanel';

const classes = {
  root: `${PREFIX}-root`,
  input: `${PREFIX}-input`,
  debug: `${PREFIX}-debug`,
  form: `${PREFIX}-form`
};

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.root}`]: {
    height: 'min-content'
  },
  [`& .${classes.debug}`]: {
    border: `2px solid ${theme.palette.error.main}`
  },
  [`& .${classes.form}`]: {
    marginTop: '10px',
    border: '0.5px solid #CDCDCD',
    borderRadius: '5px',
    '& .MuiSelect-select': {
      display: 'flex',
      alignItems: 'center',
      alignContents: 'center',
      width: '250px',
      height: '20px'
    }
  }
}));

const ExchangePanel = () => {
  const {
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    amountToSend,
    setAmountToSend,
    exchangeRate,
    fees,
    amountToReceive,
    createSwapTransaction
  } = useExchange();
  const { allWallets, isLoading: isWalletLoading } = useWallets();

  // By default selecting the first wallet
  useEffect(() => {
    if (!currentWalletId && !isWalletLoading) {
      setCurrentWalletId(allWallets[0]._id);
    }
  }, [isWalletLoading, allWallets]);

  const handleChangeAmountToSend = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAmountToSend(event.target.value);
  };

  const { coinData, setCurrentWalletId, currentWalletId } = useWalletData();

  // TODO: Remove hardcoded wallet id with the selected wallet id

  const [currentWalletDetails, setCurrentWalletDetails] =
    useState<Wallet | null>(null);

  useEffect(() => {
    if (isWalletLoading) return;

    const wallet = allWallets.find(elem => elem._id === currentWalletId);
    if (wallet) {
      setCurrentWalletDetails(wallet);
    }
  }, [currentWalletId, isWalletLoading]);

  const { deviceConnection, deviceSdkVersion, setIsInFlow } = useConnection();

  const [isVerifySwapDetailsOpen, setIsVerifySwapDetailsOpen] = useState(false);
  const [isSwapCompleted, setIsSwapCompleted] = useState(false);
  const [swapTransactionId, setSwapTransactionId] = useState('');

  const receiveTransaction = useReceiveTransaction();
  const sendTransaction = useSendTransaction();

  const startReceiveFlow = () => {
    setIsVerifySwapDetailsOpen(true);
    receiveTransaction
      .handleReceiveTransaction({
        connection: deviceConnection,
        sdkVersion: deviceSdkVersion,
        setIsInFlow,
        walletId: currentWalletId,
        coinType: toToken.slug,
        coinName: COINS[toToken.slug]?.name,
        xpub: toToken.xpub,
        zpub: toToken.zpub
      })
      .then(() => {
        logger.info('Swap Transaction: Receive Flow Started');
      })
      .catch(err => {
        logger.error('Swap Transaction: Receive Flow Failed', err);
      });
  };

  const startSendFlow = async () => {
    const sendDetails = await createSwapTransaction(
      receiveTransaction.receiveAddress
    );

    setSwapTransactionId(sendDetails.id);

    logger.info('Swap Transaction: Changelly Transaction Created', sendDetails);

    let customAccount: string | undefined;

    if (fromToken.slug === 'near') {
      const customAccounts = await customAccountDb.getAll({
        coin: fromToken.slug,
        walletId: fromToken.walletId
      });
      customAccount = customAccounts[0].name;
    }

    const recipientData: RecipientData = {
      id: 0,
      recipient: sendDetails.payinAddress,
      amount: amountToSend,
      errorRecipient: '',
      errorAmount: ''
    };

    sendTransaction
      .handleSendTransaction({
        connection: deviceConnection,
        sdkVersion: deviceSdkVersion,
        setIsInFlow,
        walletId: currentWalletId,
        xpub: fromToken.xpub,
        zpub: fromToken.zpub,
        coinType: fromToken.slug,
        fees: +fees,
        pinExists: currentWalletDetails?.passwordSet,
        passphraseExists: currentWalletDetails?.passphraseSet,
        customAccount,
        newAccountId: null,
        outputList: changeFormatOfOutputList(
          [recipientData],
          fromToken.slug,
          undefined
        ),
        data: {},
        isSendAll: false
      })
      .then(() => {
        logger.info('Swap Transaction: Send Flow Completed');
      })
      .catch(err => {
        logger.error('Swap Transaction: Send Flow Failed', err);
      });
  };

  useEffect(() => {
    if (receiveTransaction.verified) {
      startSendFlow();
    }
  }, [receiveTransaction.verified]);

  useEffect(() => {
    if (sendTransaction.signedTxn) {
      setIsVerifySwapDetailsOpen(false);
      setIsSwapCompleted(true);
    }
  }, [sendTransaction.signedTxn]);

  return (
    <Root>
      {
        <SwapDetailsForm
          fromToken={fromToken}
          setFromToken={setFromToken}
          toToken={toToken}
          setToToken={setToToken}
          coinData={coinData}
          amountToSend={amountToSend}
          setAmountToSend={setAmountToSend}
          handleChangeAmountToSend={handleChangeAmountToSend}
          classesForm={classes.form}
        />
      }
      {amountToReceive && (
        <>
          {
            <NetworkFeeDetails
              fromToken={fromToken.slug.toUpperCase()}
              toToken={toToken.slug.toUpperCase()}
              fees={fees}
              exchangeRate={exchangeRate}
              result={+amountToReceive}
              price={toToken.price}
            />
          }
          <Grid
            container
            xs={12}
            justifyContent={'center'}
            alignContent={'center'}
            alignItems={'center'}
            paddingTop={3}
          >
            <Grid item>
              <Button onClick={startReceiveFlow}>
                <Typography
                  variant="h5"
                  color="textPrimary"
                  sx={{ padding: '5px 30px' }}
                >
                  Exchange
                </Typography>
              </Button>
            </Grid>
          </Grid>
        </>
      )}
      {isVerifySwapDetailsOpen && (
        <VerifySwapDetailsDialog
          open={isVerifySwapDetailsOpen}
          onClose={() => {
            receiveTransaction.cancelReceiveTxn(deviceConnection);
            logger.info('Swap Transaction: Receive Flow Cancelled');

            sendTransaction.cancelSendTxn(deviceConnection);
            logger.info('Swap Transaction: Receive Flow Cancelled');
            setIsVerifySwapDetailsOpen(false);
          }}
          amountToSend={amountToSend}
          amountToReceive={amountToReceive}
          networkFees={fees}
          sourceCoinSlug={fromToken.slug.toUpperCase()}
          sourceCoinName={COINS[fromToken.slug]?.name}
          targetCoinSlug={toToken.slug.toUpperCase()}
          targetCoinName={COINS[toToken.slug]?.name}
          cardTapped={receiveTransaction.cardTapped}
          receiveAddressVerified={receiveTransaction.verified}
        />
      )}
      {isSwapCompleted && (
        <SwapCompletedDialog
          open={isSwapCompleted}
          onClose={() => {
            setIsSwapCompleted(false);
          }}
          toTokenName={COINS[toToken.slug]?.name}
          transactionId={swapTransactionId}
        />
      )}
    </Root>
  );
};

export default ExchangePanel;
