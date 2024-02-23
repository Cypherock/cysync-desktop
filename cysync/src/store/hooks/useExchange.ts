import { COINS, Erc20CoinData } from '@cypherock/communication';
import Server from '@cypherock/server-wrapper';
import { useEffect, useState } from 'react';

import logger from '../../mainProcess/logger';
import { accountDb, DisplayCoin, Wallet } from '../database';
import {
  changeFormatOfOutputList,
  useSwapTransaction,
  UseSwapTransactionValues,
  useWalletData
} from '../hooks';
import { useConnection, useWallets } from '../provider';

import { ReceiveFlowSteps, SendFlowSteps } from './helper/FlowSteps';

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
  startSwapFlow: () => void;
  cancelSwapTransaction: () => void;
  isSwapCompleted: boolean;
  swapTransaction: UseSwapTransactionValues;
  toWallet: Wallet;
  setToWallet: React.Dispatch<React.SetStateAction<Wallet>>;
  fromWallet: Wallet;
  setFromWallet: React.Dispatch<React.SetStateAction<Wallet>>;
  fromWalletCoinData: DisplayCoin[];
  toWalletCoinData: DisplayCoin[];
  allWallets: Wallet[];
  receiveFlowStep: ReceiveFlowSteps;
  sendFlowStep: SendFlowSteps;
  changellyCoinId: (
    coinId: string
  ) =>
    | 'bitcoin'
    | 'ethereum'
    | 'solana'
    | 'polygon'
    | 'bitcoin-testnet'
    | 'near'
    | 'litecoin'
    | 'dogecoin';
  deviceSerial: string;
}

export type UseExchange = () => UseExchangeValues;

export const useExchange: UseExchange = () => {
  const { allWallets, isLoading: isWalletLoading } = useWallets();
  const { getCoinsWithPrices } = useWalletData();

  const { deviceConnection, deviceSdkVersion, setIsInFlow, deviceSerial } =
    useConnection();
  const swapTransaction = useSwapTransaction();

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

  const [receiveFlowStep, setReceiveFlowStep] = useState<ReceiveFlowSteps>(
    ReceiveFlowSteps.EnterPin
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

  useEffect(() => {
    if (swapTransaction.receiveFlow.receiveFlowCardTapped) {
      setReceiveFlowStep(ReceiveFlowSteps.TapCard);
      setReceiveAddress(swapTransaction.receiveFlow.receiveAddress);
    }
  }, [swapTransaction.receiveFlow.receiveFlowPinEntered]);

  // Set the receive address once the card is tapped
  useEffect(() => {
    if (swapTransaction.receiveFlow.receiveFlowCardTapped) {
      setReceiveFlowStep(ReceiveFlowSteps.VerifyReceiveAddress);
      setReceiveAddress(swapTransaction.receiveFlow.receiveAddress);
    }
  }, [swapTransaction.receiveFlow.receiveFlowCardTapped]);

  useEffect(() => {
    if (swapTransaction.receiveFlow.receiveAddressVerified) {
      setReceiveFlowStep(ReceiveFlowSteps.Completed);
      setSendFlowStep(SendFlowSteps.VerifySendAddress);
    }
  }, [swapTransaction.receiveFlow.receiveAddressVerified]);

  useEffect(() => {
    if (swapTransaction.sendFlow.sendFlowCardsTapped) {
      setSendFlowStep(SendFlowSteps.VerifySendAddress);
    }
  }, [swapTransaction.sendFlow.sendFlowCardsTapped]);

  useEffect(() => {
    if (swapTransaction.sendFlow.sendFlowVerified) {
      setSendFlowStep(SendFlowSteps.EnterPin);
    }
  }, [swapTransaction.sendFlow.sendFlowVerified]);

  useEffect(() => {
    if (swapTransaction.sendFlow.sendFlowPinEntered) {
      setSendFlowStep(SendFlowSteps.TapCard);
    }
  }, [swapTransaction.sendFlow.sendFlowPinEntered]);

  useEffect(() => {
    if (fromToken && toToken && amountToSend) {
      getCurrentExchangeRate();
    }
  }, [fromToken, toToken, amountToSend]);

  useEffect(() => {
    if (swapTransaction.sendFlow.signedTxn) {
      setIsSwapCompleted(true);
    }
  }, [swapTransaction.sendFlow.signedTxn]);

  /**
   * Fetches the rate of exchanging tokens from `fromToken` to `toToken` for an
   * amount of `amountToSend`. Also updates the `fees` and `amountToReceive`.
   */
  const getCurrentExchangeRate = async () => {
    const { data } = await Server.swap
      .getExchangeRate({
        from: COINS[fromToken.coinId]?.abbr,
        to: COINS[toToken.coinId]?.abbr,
        amount: amountToSend
      })
      .request();

    setExchangeRate(data.message.result[0].rate);
    setFees(data.message.result[0].fee);
    setAmountToReceive(data.message.result[0].result);
  };

  /**
   * Fetches all the transactions for a given wallet.
   *
   * @param walletId The wallet to fetch the transactions for.
   * @returns An array of transactions.
   */
  const getSwapTransactions = async (walletId: string) => {
    const { data } = await Server.swap.getTransactions({ walletId }).request();
    return data.message.result;
  };

  const startSwapFlow = async () => {
    logger.info('SwapTransaction: Swap Flow Started');

    const recipientData = {
      id: 0,
      recipient: '',
      amount: amountToSend,
      errorRecipient: '',
      errorAmount: ''
    };

    const coinAbbr = fromToken
      ? COINS[fromToken.coinId]?.tokenList[fromToken.coinId]?.abbr
      : COINS[fromToken.coinId].abbr;

    let contractAddress: string | undefined;
    if (fromToken && fromToken instanceof Erc20CoinData) {
      contractAddress = fromToken.address;
    }

    swapTransaction
      .handleSwapTransaction({
        connection: deviceConnection,
        sdkVersion: deviceSdkVersion,
        setIsInFlow,
        sendAmount: amountToSend,
        receiveAmount: amountToReceive,
        changellyFee: fees,
        sendFlow: {
          walletId: fromWallet?._id,
          accountId: fromToken.accountId,
          accountIndex: fromToken.accountIndex,
          accountType: fromToken.accountType,
          xpub: fromToken.xpub,
          coinId: fromToken.coinId,
          fees: +fees,
          pinExists: fromWallet?.passwordSet,
          passphraseExists: fromWallet?.passphraseSet,
          customAccount: null,
          newAccountId: null,
          outputList: changeFormatOfOutputList(
            [recipientData],
            fromToken.coinId,
            undefined
          ),
          data: {
            gasLimit: 21000,
            contractAddress,
            contractAbbr: coinAbbr ? coinAbbr.toUpperCase() : undefined
          },
          isSendAll: true
        },
        receiveFlow: {
          walletId: toWallet._id,
          accountId: toToken.accountId,
          accountIndex: toToken.accountIndex,
          accountType: toToken.accountType,
          coinId: toToken.coinId,
          coinName: COINS[toToken.coinId]?.name,
          xpub: toToken.xpub,
          passphraseExists: toWallet.passphraseSet
        },
        deviceSerialId: deviceSerial
      })
      .then(() => {
        logger.info('SwapTransaction: Started');
        setIsSwapCompleted(true);
      })
      .catch(err => {
        logger.error('SwapTransaction: Failed', err);
      });
  };

  const resetStates = () => {
    setReceiveFlowStep(ReceiveFlowSteps.EnterPin);
    setSendFlowStep(SendFlowSteps.Waiting);
  };

  /**
   * Cancel the receive and send flow.
   */
  const cancelSwapTransaction = () => {
    resetStates();
    swapTransaction.cancelSwapTransaction(deviceConnection);
    logger.info('SwapTransaction: Cancelled');
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
    // const res = await coinDb.getAll({ walletId });
    const res = await accountDb.getAll({ walletId });
    const unsortedCoins = await getCoinsWithPrices(res);
    return unsortedCoins;
  };

  const changellyCoinId = (coinId: string) => {
    switch (coinId) {
      case 'btc':
        return 'bitcoin';
      case 'eth':
        return 'ethereum';
      case 'sol':
        return 'solana';
      case 'matic':
        return 'polygon';
      case 'btct':
        return 'bitcoin-testnet';
      case 'near':
        return 'near';
      case 'ltc':
        return 'litecoin';
      case 'doge':
        return 'dogecoin';
    }
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
    startSwapFlow,
    cancelSwapTransaction,
    isSwapCompleted,
    swapTransaction,
    toWallet,
    setToWallet,
    fromWallet,
    setFromWallet,
    fromWalletCoinData,
    toWalletCoinData,
    allWallets,
    receiveFlowStep,
    sendFlowStep,
    changellyCoinId,
    deviceSerial
  };
};
