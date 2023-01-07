// import { COINS } from '@cypherock/communication';
import axios from 'axios';
import { useEffect, useState } from 'react';

import logger from '../../mainProcess/logger';
import { coinDb, customAccountDb, Wallet } from '../database';
import {
  changeFormatOfOutputList,
  DisplayCoin,
  useReceiveTransaction,
  useSendTransaction,
  useSwapTransaction,
  useWalletData
} from '../hooks';
import { useConnection, useWallets } from '../provider';

import { ReceiveFlowSteps, SendFlowSteps } from './helper/FlowSteps';

// TODO: get the base URL from the config
const baseUrl = 'http://localhost:5000/swap';

export interface UseExchangeValues {
  fromToken: DisplayCoin;
  setFromToken: React.Dispatch<React.SetStateAction<DisplayCoin>>;
  toToken: DisplayCoin;
  setToToken: React.Dispatch<React.SetStateAction<DisplayCoin>>;
  amountToSend: string;
  setAmountToSend: React.Dispatch<React.SetStateAction<string>>;
  exchangeRate: string;
  fees: string;
  amountToReceive: string;
  receiveAddress: string;
  // tslint:disable-next-line: no-any
  getSwapTransactions: (walletId: string) => Promise<any>;
  startReceiveFlow: () => void;
  generateSwapTransaction: () => Promise<void>;
  startSendFlow: () => void;
  cancelSwapTransaction: () => void;
  isSwapCompleted: boolean;
  // tslint:disable-next-line: no-any
  swapTransaction: any;
  handleUserVerifiedSendAddress: () => void;
  toWallet: Wallet;
  setToWallet: React.Dispatch<React.SetStateAction<Wallet>>;
  fromWallet: Wallet;
  setFromWallet: React.Dispatch<React.SetStateAction<Wallet>>;
  fromWalletCoinData: DisplayCoin[];
  toWalletCoinData: DisplayCoin[];
  allWallets: Wallet[];
  receiveFlowStep: ReceiveFlowSteps;
  sendFlowStep: SendFlowSteps;
}

export type UseExchange = () => UseExchangeValues;

export const useExchange: UseExchange = () => {
  const { allWallets, isLoading: isWalletLoading } = useWallets();
  const { getCoinsWithPrices } = useWalletData();

  const { deviceConnection, deviceSdkVersion, setIsInFlow } = useConnection();
  const receiveTransaction = useReceiveTransaction();
  const sendTransaction = useSendTransaction();
  const fswapTransaction = useSwapTransaction();

  const [fromToken, setFromToken] = useState<DisplayCoin>();
  const [toToken, setToToken] = useState<DisplayCoin>();
  const [toWallet, setToWallet] = useState<Wallet>();
  const [fromWallet, setFromWallet] = useState<Wallet>();
  const [fromWalletCoinData, setFromWalletCoinData] = useState<DisplayCoin[]>(
    []
  );
  const [toWalletCoinData, setToWalletCoinData] = useState<DisplayCoin[]>([]);
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

  // Fetch the coins from the database when the source wallet changes
  useEffect(() => {
    const setCoinListFromWallet = async () => {
      const coins = await getAllCoinsFromWallet(fromWallet?._id);
      setFromWalletCoinData(coins);
    };
    setCoinListFromWallet();
  }, [fromWallet]);

  // Fetch the coins from the database when the destination wallet changes
  useEffect(() => {
    const setCoinListToWallet = async () => {
      const coins = await getAllCoinsFromWallet(toWallet?._id);
      setToWalletCoinData(coins);
    };
    setCoinListToWallet();
  }, [toWallet]);

  // Set the first wallet as the default from and to wallet
  useEffect(() => {
    if (!isWalletLoading) {
      setFromWallet(allWallets[0]);
      setToWallet(allWallets[0]);
    }
  }, [isWalletLoading, allWallets]);

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
  const getSwapTransactions = async (walletId: string) => {
    const { data } = await axios.get(`${baseUrl}/transactions`, {
      params: { walletId }
    });
    return data.message.result;
  };

  /**
   * Starts the first part of the swap process i.e the receive flow.
   */
  const startReceiveFlow = () => {
    fswapTransaction.handleSwapTransaction({
      connection: deviceConnection,
      sdkVersion: deviceSdkVersion,
      setIsInFlow,
      sendFlow,
      receiveFlow
    });
    // receiveTransaction
    //   .handleReceiveTransaction({
    //     connection: deviceConnection,
    //     sdkVersion: deviceSdkVersion,
    //     setIsInFlow,
    //     walletId: toWallet._id,
    //     coinType: toToken.slug,
    //     coinName: COINS[toToken.slug]?.name,
    //     xpub: toToken.xpub,
    //     zpub: toToken.zpub,
    //     passphraseExists: toWallet.passphraseSet
    //   })
    //   .then(() => {
    //     logger.info('Swap Transaction: Receive Flow Started');
    //   })
    //   .catch(err => {
    //     logger.error('Swap Transaction: Receive Flow Failed', err);
    //   });
  };

  /**
   * Creates a swap transaction with the toWallet id as the receiving wallet.
   */
  const generateSwapTransaction = async () => {
    const sendDetails = await createSwapTransaction(toWallet?._id);
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
        walletId: fromWallet?._id,
        xpub: fromToken.xpub,
        zpub: fromToken.zpub,
        coinType: fromToken.slug,
        fees: +fees,
        pinExists: fromWallet?.passwordSet,
        passphraseExists: fromWallet?.passphraseSet,
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

  /**
   * Get all the coins that are added to a wallet.
   *
   * @param walletId The wallet to fetch the coins for.
   * @returns A promise that resolves to an array of DisplayCoins.
   */
  const getAllCoinsFromWallet = async (
    walletId: string
  ): Promise<DisplayCoin[]> => {
    const res = await coinDb.getAll({ walletId });
    const unsortedCoins = await getCoinsWithPrices(res);
    return unsortedCoins;
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
    isSwapCompleted,
    swapTransaction,
    handleUserVerifiedSendAddress,
    toWallet,
    setToWallet,
    fromWallet,
    setFromWallet,
    fromWalletCoinData,
    toWalletCoinData,
    allWallets,
    receiveFlowStep,
    sendFlowStep
  };
};
