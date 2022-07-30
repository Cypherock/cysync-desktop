import { CoinGroup, COINS } from '@cypherock/communication';
import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';

import {
  CustomAccount,
  customAccountDb,
  getLatestPriceForCoin,
  priceHistoryDb
} from '../database';

import { DisplayCustomAccount } from './types';
import { useDebouncedFunction } from './useDebounce';

export interface UseCustomAccountValues {
  getAllCustomAccountsFromWallet: (
    walletId: string,
    coin: string
  ) => Promise<void>;
  customAccountData: DisplayCustomAccount[];
  customAccountList: string[];
  setCurrentWalletId: React.Dispatch<React.SetStateAction<string>>;
  setCurrentCoin: React.Dispatch<React.SetStateAction<string>>;
  sortCustomAccountData: (accounts: DisplayCustomAccount[]) => void;
}

export type UseCustomAccount = () => UseCustomAccountValues;

export const useCustomAccount: UseCustomAccount = () => {
  const [customAccountData, setCustomAccountData] = useState<
    UseCustomAccountValues['customAccountData']
  >([]);
  const [customAccountList, setCustomAccountList] = useState<
    UseCustomAccountValues['customAccountList']
  >([]);

  const [currentWalletId, setCurrentWalletId] = useState('');
  const [currentCoin, setCurrentCoin] = useState('');

  // Using doRefresh mechanish because hooks state change do not work with event listeners.
  const [doRefresh, setDoRefresh] = useState(false);

  const onDBChange = () => {
    setDoRefresh(true);
  };

  const onChange = useDebouncedFunction(onDBChange, 800);

  useEffect(() => {
    priceHistoryDb.emitter.on('insert', onChange);
    priceHistoryDb.emitter.on('update', onChange);

    customAccountDb.emitter.on('insert', onChange);
    customAccountDb.emitter.on('update', onChange);
    customAccountDb.emitter.on('delete', onChange);

    return () => {
      priceHistoryDb.emitter.removeListener('insert', onChange);
      priceHistoryDb.emitter.removeListener('update', onChange);

      customAccountDb.emitter.removeListener('insert', onChange);
      customAccountDb.emitter.removeListener('update', onChange);
      customAccountDb.emitter.removeListener('delete', onChange);
    };
  }, []);

  const getCustomAccountWithPrices = async (accounts: CustomAccount[]) => {
    const customAccountWithPrice: DisplayCustomAccount[] = [];
    for (const account of accounts) {
      const coinObj = COINS[account.coin.toLowerCase()];
      if (!coinObj || coinObj.group !== CoinGroup.Near) {
        throw new Error(`Cannot find coinType: ${account.coin}`);
      }
      const coinWithPrice: DisplayCustomAccount = {
        ...account,
        isImplicit: account.name.length === 64,
        isEmpty: true,
        displayPrice: '0',
        displayValue: '0',
        displayBalance: '0'
      };
      const balance = new BigNumber(account.balance || 0).dividedBy(
        coinObj.multiplier
      );

      const price = await getLatestPriceForCoin(account.coin);
      const value = balance.multipliedBy(price);

      coinWithPrice.displayBalance = balance.toString();

      coinWithPrice.displayValue = value.toFixed(2);
      coinWithPrice.displayPrice = price.toFixed(2);
      coinWithPrice.isEmpty = balance.isZero();

      customAccountWithPrice.push(coinWithPrice);
    }

    return customAccountWithPrice.sort((a, b) => {
      if (a.isImplicit) return -1;
      if (b.isImplicit) return 1;
      if (a.displayValue > b.displayValue) return -1;
      if (a.displayValue < b.displayValue) return 1;
      return 0;
    });
  };

  const sortCustomAccountData: UseCustomAccountValues['sortCustomAccountData'] =
    accounts => {
      setCustomAccountData(
        [...accounts].sort((a, b) => {
          if (a.isImplicit) return -1;
          if (b.isImplicit) return 1;
          const numA = new BigNumber(a.displayBalance);
          const numB = new BigNumber(b.displayBalance);
          return numB.comparedTo(numA);
        })
      );
    };

  const getAllCustomAccountsFromWallet = async (
    walletId: string,
    coin: string
  ) => {
    const res = await customAccountDb.getAll({ walletId, coin });
    const accounts: string[] = [];
    res.forEach(account => {
      accounts.push(account.name);
    });
    setCustomAccountList(accounts);
    const unsortedCustomAccounts = await getCustomAccountWithPrices(res);
    sortCustomAccountData(unsortedCustomAccounts);
  };

  useEffect(() => {
    if (currentWalletId && currentCoin)
      getAllCustomAccountsFromWallet(currentWalletId, currentCoin);
  }, [currentWalletId, currentCoin]);

  useEffect(() => {
    if (doRefresh) {
      setDoRefresh(false);
      getAllCustomAccountsFromWallet(currentWalletId, currentCoin);
    }
  }, [doRefresh]);

  return {
    getAllCustomAccountsFromWallet,
    customAccountData,
    customAccountList,
    setCurrentWalletId,
    setCurrentCoin
  } as UseCustomAccountValues;
};
