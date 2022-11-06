import { COINS } from '@cypherock/communication';
import axios from 'axios';
import { useEffect, useState } from 'react';

import logger from '../../mainProcess/logger';
import { customAccountDb, Wallet } from '../database';
import {
  changeFormatOfOutputList,
  DisplayCoin,
  useReceiveTransaction,
  useSendTransaction
} from '../hooks';
import { useConnection } from '../provider';

import { ReceiveFlowSteps, SendFlowSteps } from './helper/FlowSteps';

// TODO: get the base URL from the config
const baseUrl = 'http://localhost:5000/swap';

export const useExchange = (currentWalletDetails: Wallet) => {
  const { deviceConnection, deviceSdkVersion, setIsInFlow } = useConnection();
  const receiveTransaction = useReceiveTransaction();
  const sendTransaction = useSendTransaction();

  const [fromToken, setFromToken] = useState<DisplayCoin>();
  const [toToken, setToToken] = useState<DisplayCoin>();
  const [amountToSend, setAmountToSend] = useState('');
  const [fees, setFees] = useState('');
  const [amountToReceive, setAmountToReceive] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [receiveAddress, setReceiveAddress] = useState('');
  const [isSwapCompleted, setIsSwapCompleted] = useState(false);
  const [swapTransaction, setSwapTransaction] = useState({
    id: '',
    payinAddress: ''
  });
  const [receiveFlowStep, setReceiveFlowStep] = useState<ReceiveFlowSteps>(
    ReceiveFlowSteps.EnterPinAndTapCard
  );
  const [sendFlowStep, setSendFlowStep] = useState<SendFlowSteps>(
    SendFlowSteps.Waiting
  );

  // Set the receive address once the card is tapped
  useEffect(() => {
    if (receiveTransaction.cardTapped) {
      setReceiveFlowStep(ReceiveFlowSteps.VerifyReceiveAddress);
      setReceiveAddress(receiveTransaction?.receiveAddress);
    }
  }, [receiveTransaction.cardTapped]);

  useEffect(() => {
    if (receiveTransaction.verified) {
      setReceiveFlowStep(ReceiveFlowSteps.Completed);
      setSendFlowStep(SendFlowSteps.VerifySendAddress);
    }
  }, [receiveTransaction.verified]);

  useEffect(() => {
    if (sendTransaction.verified) {
      setSendFlowStep(SendFlowSteps.EnterPin);
    }
  }, [sendTransaction.verified]);

  useEffect(() => {
    if (sendTransaction.pinEntered) {
      setSendFlowStep(SendFlowSteps.TapCard);
    }
  }, [sendTransaction.pinEntered]);

  useEffect(() => {
    if (sendTransaction.cardsTapped) {
      setSendFlowStep(SendFlowSteps.SignTransaction);
    }
  }, [sendTransaction.cardsTapped]);

  useEffect(() => {
    if (fromToken && toToken && amountToSend) {
      getCurrentExchangeRate();
    }
  }, [fromToken, toToken, amountToSend]);

  useEffect(() => {
    if (receiveTransaction.verified) {
      generateSwapTransaction();
    }
  }, [receiveTransaction.verified]);

  useEffect(() => {
    if (sendTransaction.signedTxn) {
      setIsSwapCompleted(true);
    }
  }, [sendTransaction.signedTxn]);

  /**
   * Fetches the rate of exchanging tokens from `fromToken` to `toToken` for an
   * amount of `amountToSend`. Also updates the `fees` and `amountToReceive`.
   */
  const getCurrentExchangeRate = async () => {
    const { data } = await axios.get(`${baseUrl}/exchangeDetails`, {
      params: { from: fromToken.slug, to: toToken.slug, amount: amountToSend }
    });
    setExchangeRate(data.message.result[0].rate);
    setFees(data.message.result[0].fee);
    setAmountToReceive(data.message.result[0].result);
  };

  /**
   *  Creates a swap transaction between `fromToken` and `toToken` for an amount
   *
   * @param walletId The wallet to use for the swap
   * @returns The transaction ID to later check the status of the swap and the
   * payment address to send the tokens to.
   */
  const createSwapTransaction = async (walletId: string) => {
    const { data } = await axios.get(`${baseUrl}/transaction`, {
      params: {
        walletId,
        from: fromToken.slug,
        to: toToken.slug,
        amount: amountToSend,
        address: receiveAddress
      }
    });
    return {
      id: data.message.result.id,
      payinAddress: data.message.result.payinAddress
    };
  };

  /**
   * Fetches all the transactions for a given wallet.
   *
   * @param walletId The wallet to fetch the transactions for.
   * @returns An array of transactions.
   */
  const getSwapTransactions = async () => {
    const { data } = await axios.get(`${baseUrl}/transactions`, {
      params: { walletId: currentWalletDetails?._id }
    });
    return data.message.result;
  };

  /**
   * Starts the first part of the swap process i.e the receive flow.
   */
  const startReceiveFlow = () => {
    receiveTransaction
      .handleReceiveTransaction({
        connection: deviceConnection,
        sdkVersion: deviceSdkVersion,
        setIsInFlow,
        walletId: currentWalletDetails._id,
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

  /**
   * Creates a swap transaction.
   */
  const generateSwapTransaction = async () => {
    const sendDetails = await createSwapTransaction(currentWalletDetails._id);

    setSwapTransaction(sendDetails);
  };

  /**
   * Starts the second part of the swap process i.e the send flow.
   */
  const startSendFlow = async () => {
    logger.info('Swap Transaction: Swap Transaction Created', swapTransaction);

    let customAccount: string | undefined;

    if (fromToken.slug === 'near') {
      const customAccounts = await customAccountDb.getAll({
        coin: fromToken.slug,
        walletId: fromToken.walletId
      });
      customAccount = customAccounts[0].name;
    }

    const recipientData = {
      id: 0,
      recipient: swapTransaction.payinAddress,
      amount: amountToSend,
      errorRecipient: '',
      errorAmount: ''
    };

    sendTransaction
      .handleSendTransaction({
        connection: deviceConnection,
        sdkVersion: deviceSdkVersion,
        setIsInFlow,
        walletId: currentWalletDetails._id,
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

  /**
   * Cancel the receive and send flow.
   */
  const cancelSwapTransaction = () => {
    receiveTransaction.cancelReceiveTxn(deviceConnection);
    logger.info('Swap Transaction: Receive Flow Cancelled');

    sendTransaction.cancelSendTxn(deviceConnection);
    logger.info('Swap Transaction: Send Flow Cancelled');
  };

  /**
   * Start the send flow once the user verifies the send address.
   */
  const handleUserVerifiedSendAddress = () => {
    startSendFlow();
  };

  return {
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    amountToSend,
    setAmountToSend,
    exchangeRate,
    fees,
    amountToReceive,
    receiveAddress,
    getSwapTransactions,
    startReceiveFlow,
    generateSwapTransaction,
    startSendFlow,
    cancelSwapTransaction,
    receiveFlowStep,
    sendFlowStep,
    isSwapCompleted,
    swapTransaction,
    handleUserVerifiedSendAddress
  };
};
