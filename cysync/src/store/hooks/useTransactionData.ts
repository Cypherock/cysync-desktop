import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';

import logger from '../../utils/logger';
import { transactionDb } from '../database';

import { DisplayTransaction } from './types';
import { useDebouncedFunction } from './useDebounce';
import { useHistory } from './useHistory';

export interface UseTransactionDataValues {
  setDays: React.Dispatch<React.SetStateAction<number>>;
  isLoading: boolean;
  showTxn: DisplayTransaction | null;
  setShowTxn: React.Dispatch<React.SetStateAction<DisplayTransaction | null>>;
  allTxn: DisplayTransaction[];
  setCurrentWallet: React.Dispatch<React.SetStateAction<string | undefined>>;
  walletIndex: number;
  coinIndex: number;
  accountIndex: number;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setCoinIndex: React.Dispatch<React.SetStateAction<number>>;
  setAccountIndex: React.Dispatch<React.SetStateAction<number>>;
  setCurrentAccount: React.Dispatch<React.SetStateAction<string | undefined>>;
  setCurrentCoin: React.Dispatch<React.SetStateAction<string | undefined>>;
  setWalletIndex: React.Dispatch<React.SetStateAction<number>>;
  sortTxns: (index: number) => void;
  sortIndex: number;
  setSortIndex: React.Dispatch<React.SetStateAction<number>>;
  onInitialSetupDone: () => void;
  isInitialSetupDone: boolean;
  currentCoin: string;
  currentWallet: string;
  currentAccount: string;
}

export type UseTransactionData = () => UseTransactionDataValues;

export const useTransactionData: UseTransactionData = () => {
  const [days, setDays] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [showTxn, setShowTxn] =
    useState<UseTransactionDataValues['showTxn']>(null);
  const [allTxn, setAllTxn] = useState<UseTransactionDataValues['allTxn']>([]);
  const { getAll } = useHistory();
  const [currentWallet, setCurrentWallet] = useState<string | undefined>(
    undefined
  );
  const [currentAccount, setCurrentAccount] = useState<string | undefined>(
    undefined
  );
  const [currentCoin, setCurrentCoin] = useState<string | undefined>(undefined);
  const [walletIndex, setWalletIndex] = useState(0);
  const [accountIndex, setAccountIndex] = useState(0);
  const [coinIndex, setCoinIndex] = useState(0);
  const [sortIndex, setSortIndex] = useState(3);
  // If the initial setup is done (i.e, the coin and wallet data are added), then only the txns will be fetched.
  const [isInitialSetupDone, setIsIntialDoneSetup] = useState(false);

  // Using doRefresh mechanish because hooks state change do not work with event listeners.
  const [doRefresh, setDoRefresh] = useState(false);

  const refreshFromDB = () => {
    setDoRefresh(true);
  };

  const onInitialSetupDone = () => {
    setIsIntialDoneSetup(true);
  };

  const debouncedRefreshFromDB = useDebouncedFunction(refreshFromDB, 2000);
  const debouncedSetInitialSetupDone = useDebouncedFunction(
    onInitialSetupDone,
    500
  );

  useEffect(() => {
    transactionDb.emitter.on('insert', debouncedRefreshFromDB);
    transactionDb.emitter.on('update', debouncedRefreshFromDB);
    transactionDb.emitter.on('delete', debouncedRefreshFromDB);

    return () => {
      transactionDb.emitter.removeListener('insert', debouncedRefreshFromDB);
      transactionDb.emitter.removeListener('update', debouncedRefreshFromDB);
      transactionDb.emitter.removeListener('delete', debouncedRefreshFromDB);
    };
  }, []);

  const sortFromTxns = (txns: DisplayTransaction[], index: number) => {
    let sortFunc:
      | ((a: DisplayTransaction, b: DisplayTransaction) => number)
      | null = null;

    switch (index) {
      case 0:
        sortFunc = (a, b) => {
          if (a.displayValue > b.displayValue) return -1;
          if (a.displayValue < b.displayValue) return 1;
          return 0;
        };
        break;

      case 1:
        sortFunc = (a, b) => {
          if (a.displayValue > b.displayValue) return 1;
          if (a.displayValue < b.displayValue) return -1;
          return 0;
        };
        break;

      case 2:
        sortFunc = (a, b) => {
          const dateA = new Date(a.confirmed);
          const dateB = new Date(b.confirmed);
          return dateA.getTime() - dateB.getTime();
        };
        break;

      case 3:
        sortFunc = (a, b) => {
          const dateA = new Date(a.confirmed);
          const dateB = new Date(b.confirmed);
          return dateB.getTime() - dateA.getTime();
        };
        break;

      case 4:
        sortFunc = (a, b) => {
          const numA = new BigNumber(a.displayAmount);
          const numB = new BigNumber(b.displayAmount);
          return numB.comparedTo(numA);
        };
        break;

      case 5:
        sortFunc = (a, b) => {
          const numA = new BigNumber(a.displayAmount);
          const numB = new BigNumber(b.displayAmount);
          return numA.comparedTo(numB);
        };
        break;

      case 6:
        sortFunc = (a, b) => {
          const numA = new BigNumber(a.displayValue);
          const numB = new BigNumber(b.displayValue);
          return numB.comparedTo(numA);
        };
        break;

      case 7:
        sortFunc = (a, b) => {
          const numA = new BigNumber(a.displayValue);
          const numB = new BigNumber(b.displayValue);
          return numA.comparedTo(numB);
        };
        break;
      default:
        break;
    }

    if (sortFunc) {
      const sortedData = [...txns].sort(sortFunc);
      setAllTxn(sortedData);
    }
  };

  const sortTxns = (index: number) => {
    sortFromTxns(allTxn, index);
  };

  const getFromDB = async () => {
    let sinceDate: Date | undefined;
    if (days !== -1) {
      const date = new Date();
      sinceDate = new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
    }
    try {
      const txns = await getAll({
        sinceDate,
        walletId: currentWallet,
        accountId: currentAccount,
        coinId: currentCoin
      });

      sortFromTxns(txns, sortIndex);
    } catch (e) {
      logger.error('Error getting transactions from DB');
      logger.error(e);
    }
  };

  useEffect(() => {
    if (doRefresh) {
      setDoRefresh(false);
      getFromDB()
        .then(() => {
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [doRefresh]);

  useEffect(() => {
    if (isInitialSetupDone) {
      setIsLoading(true);
      getFromDB()
        .then(() => {
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [days, currentWallet, currentAccount, currentCoin, isInitialSetupDone]);

  useEffect(() => {
    sortTxns(sortIndex);
  }, [sortIndex]);

  return {
    setDays,
    isLoading,
    showTxn,
    setShowTxn,
    allTxn,
    setCurrentWallet,
    walletIndex,
    coinIndex,
    setIsLoading,
    setCoinIndex,
    setCurrentAccount,
    setWalletIndex,
    sortTxns,
    sortIndex,
    setSortIndex,
    onInitialSetupDone: debouncedSetInitialSetupDone,
    isInitialSetupDone,
    setCurrentCoin,
    accountIndex,
    setAccountIndex,
    currentCoin,
    currentWallet,
    currentAccount
  };
};
