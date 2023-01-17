import { COINS } from '@cypherock/communication';
import { Grid, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';

import Button from '../../../../../../designSystem/designComponents/buttons/button';
import { useExchange } from '../../../../../../store/hooks';

import SwapCompletedDialog from './dialogs/SwapCompletedDialog';
import VerifySwapDetailsDialog from './dialogs/VerifySwapDetailsDialog';
import NetworkFeeDetails from './NetworkFeeDetails';
import SwapDetailsForm from './SwapDetailsForm';

const PREFIX = 'ExchangePanel';

const classes = {
  form: `${PREFIX}-form`
};

const Root = styled('div')(() => ({
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
    },
    '& .MuiOutlinedInput-input': {
      textAlign: 'right'
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
    startSwapFlow,
    cancelSwapTransaction,
    receiveFlowStep,
    sendFlowStep,
    receiveAddress,
    isSwapCompleted,
    swapTransaction,
    toWallet,
    setToWallet,
    fromWallet,
    setFromWallet,
    fromWalletCoinData,
    toWalletCoinData,
    allWallets
  } = useExchange();

  const [showSwapCompletedDialog, setSwapCompletedDialog] = useState(false);
  const [showSwapDetailsVerifyDialog, setShowSwapDetailsVerifyDialog] =
    useState(false);

  useEffect(() => {
    if (isSwapCompleted) {
      setShowSwapDetailsVerifyDialog(false);
      setSwapCompletedDialog(true);
    }
  }, [isSwapCompleted]);

  const handleChangeAmountToSend = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAmountToSend(event.target.value);
  };

  return (
    <Root>
      {
        <SwapDetailsForm
          fromToken={fromToken}
          setFromToken={setFromToken}
          toToken={toToken}
          setToToken={setToToken}
          amountToSend={amountToSend}
          setAmountToSend={setAmountToSend}
          handleChangeAmountToSend={handleChangeAmountToSend}
          classesForm={classes.form}
          allWallets={allWallets}
          amountToReceive={amountToReceive || '0'}
          price={toToken?.price || 0}
          toWallet={toWallet}
          setToWallet={setToWallet}
          fromWallet={fromWallet}
          fromWalletCoinData={fromWalletCoinData}
          toWalletCoinData={toWalletCoinData}
          setFromWallet={setFromWallet}
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
            justifyContent={'center'}
            alignContent={'center'}
            alignItems={'center'}
            paddingTop={3}
          >
            <Grid item>
              <Button
                onClick={() => {
                  setShowSwapDetailsVerifyDialog(true);
                  startSwapFlow();
                }}
              >
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
      {showSwapDetailsVerifyDialog && (
        <VerifySwapDetailsDialog
          open={showSwapDetailsVerifyDialog}
          onClose={() => {
            cancelSwapTransaction();
            setShowSwapDetailsVerifyDialog(false);
          }}
          amountToSend={amountToSend}
          amountToReceive={amountToReceive}
          networkFees={fees}
          sourceCoinSlug={fromToken.slug.toUpperCase()}
          sourceCoinName={COINS[fromToken.slug]?.name}
          targetCoinSlug={toToken.slug.toUpperCase()}
          targetCoinName={COINS[toToken.slug]?.name}
          receiveAddress={receiveAddress}
          receiveFlowStep={receiveFlowStep}
          sendFlowStep={sendFlowStep}
        />
      )}
      {showSwapCompletedDialog && (
        <SwapCompletedDialog
          open={showSwapCompletedDialog}
          onClose={() => {
            setSwapCompletedDialog(false);
          }}
          toTokenName={COINS[toToken.slug]?.name}
          transactionId={swapTransaction.changellyTxnId}
        />
      )}
    </Root>
  );
};

export default ExchangePanel;
