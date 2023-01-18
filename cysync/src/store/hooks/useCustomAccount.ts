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
  getAllCustomAccountsFromWallet: (accountId: string) => Promise<void>;
  customAccountData: DisplayCustomAccount[];
  customAccountList: string[];
  setCurrentAccountId: React.Dispatch<React.SetStateAction<string>>;
  sortCustomAccountData: (accounts: DisplayCustomAccount[]) => void;
  minimumBalanceForAddAccount: number;
}

export type UseCustomAccount = () => UseCustomAccountValues;

export const useCustomAccount: UseCustomAccount = () => {
  const minimumBalanceForAddAccount = 0.25;
  const [customAccountData, setCustomAccountData] = useState<
    UseCustomAccountValues['customAccountData']
  >([]);
  const [customAccountList, setCustomAccountList] = useState<
    UseCustomAccountValues['customAccountList']
  >([]);

  const [currentAccountId, setCurrentAccountId] = useState('');

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
      const coinObj = COINS[account.coinId];
      if (!coinObj || coinObj.group !== CoinGroup.Near) {
        throw new Error(`Cannot find coinId: ${account.coinId}`);
      }
      const coinWithPrice: DisplayCustomAccount = {
        ...account,
        isImplicit: account.name.length === 64,
        isEmpty: true,
        displayPrice: '0',
        displayValue: '0',
        displayBalance: '0',
        displayNearReservedForProtocol: '0',
        displayNearNativeBalance: '0'
      };

      const balance = new BigNumber(account.balance || 0).dividedBy(
        coinObj.multiplier
      );
      const nativeBalance = new BigNumber(
        account.metadata?.near?.nativeBalance ?? 0
      ).dividedBy(coinObj.multiplier);
      const reservedBalance = BigNumber.max(
        nativeBalance.minus(balance),
        new BigNumber(0)
      );

      const price = await getLatestPriceForCoin(account.coinId);
      const value = balance.multipliedBy(price);

      coinWithPrice.displayBalance = balance.toString();
      coinWithPrice.displayNearNativeBalance = nativeBalance.toString();
      coinWithPrice.displayNearReservedForProtocol = reservedBalance.toString();

      coinWithPrice.displayValue = value.toString();
      coinWithPrice.displayPrice = price.toString();
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

  const getAllCustomAccountsFromWallet = async (accountId: string) => {
    const res = await customAccountDb.getAll({ accountId });
    const accounts: string[] = [];
    res.forEach(account => {
      accounts.push(account.name);
    });
    setCustomAccountList(accounts);
    const unsortedCustomAccounts = await getCustomAccountWithPrices(res);
    sortCustomAccountData(unsortedCustomAccounts);
  };

  useEffect(() => {
    if (currentAccountId) getAllCustomAccountsFromWallet(currentAccountId);
  }, [currentAccountId]);

  useEffect(() => {
    if (doRefresh) {
      setDoRefresh(false);
      getAllCustomAccountsFromWallet(currentAccountId);
    }
  }, [doRefresh]);

  return {
    getAllCustomAccountsFromWallet,
    customAccountData,
    customAccountList,
    setCurrentAccountId,
    sortCustomAccountData,
    minimumBalanceForAddAccount
  };
};
