import { COINS } from '@cypherock/communication';
import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';

import {
  Account,
  accountDb,
  addressDb,
  customAccountDb,
  getLatestPriceForCoin,
  priceHistoryDb,
  receiveAddressDb
} from '../database';

import { DisplayCoin } from './types';
import { useDebouncedFunction } from './useDebounce';

export interface UseWalletDataValues {
  coinData: DisplayCoin[];
  setCoinData: React.Dispatch<React.SetStateAction<DisplayCoin[]>>;
  isLoading: boolean;
  coinsPresent: Array<{
    id: string;
    accountIndex: number;
    accountType: string;
  }>;
  deleteCoinByXpub: (accountId: string) => Promise<void>;
  setCurrentWalletId: React.Dispatch<React.SetStateAction<string>>;
  currentWalletId: string;
  refreshCoins: () => void;
  sortIndex: number;
  setSortIndex: React.Dispatch<React.SetStateAction<number>>;
  sortCoinData: (coins: DisplayCoin[], index: number) => void;
  sortCoinsByIndex: (index: number) => void;
}

export type UseWalletData = () => UseWalletDataValues;

export const useWalletData: UseWalletData = () => {
  const [coinData, setCoinData] = useState<UseWalletDataValues['coinData']>([]);
  const [coinsPresent, setCoinsPresent] = useState<
    Array<{
      id: string;
      accountIndex: number;
      accountType: string;
    }>
  >([]);

  const [currentWalletId, setCurrentWalletId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [sortIndex, setSortIndex] = useState(0);

  // Using doRefresh mechanish because hooks state change do not work with event listeners.
  const [doRefresh, setDoRefresh] = useState(false);

  const getCoinsWithPrices = async (coins: Account[]) => {
    const mappedCoins: DisplayCoin[] = [];

    for (const coin of coins) {
      const coinObj = COINS[coin.coinId];
      if (!coinObj) {
        throw new Error(`Cannot find coinId: ${coin.coinId}`);
      }

      const coinWithPrice: DisplayCoin = {
        ...coin,
        isEmpty: true,
        price: await getLatestPriceForCoin(coin.coinId),
        displayValue: '0',
        displayPrice: '0',
        displayBalance: '0',
        displayNearReservedForProtocol: undefined,
        displayNearNativeBalance: undefined
      };
      const balance = new BigNumber(
        coin.totalBalance ? coin.totalBalance : 0
      ).dividedBy(coinObj.multiplier);
      const nativeBalance = coin.metadata?.near?.nativeBalance
        ? new BigNumber(coin.metadata?.near?.nativeBalance ?? 0).dividedBy(
            coinObj.multiplier
          )
        : undefined;
      const reservedBalance = nativeBalance
        ? BigNumber.max(nativeBalance.minus(balance), new BigNumber(0))
        : undefined;

      coinWithPrice.displayBalance = balance?.toString();
      coinWithPrice.displayNearNativeBalance = nativeBalance?.toString();
      coinWithPrice.displayNearReservedForProtocol =
        reservedBalance?.toString();

      const latestPrice = coinWithPrice.price;
      const value = balance.multipliedBy(latestPrice || 0);
      coinWithPrice.displayValue = value.toString();
      coinWithPrice.displayPrice = latestPrice.toString() || '0';
      coinWithPrice.isEmpty = balance.isZero();

      mappedCoins.push(coinWithPrice);
    }

    return mappedCoins;
  };

  const sortCoinData: UseWalletDataValues['sortCoinData'] = (coins, index) => {
    switch (index) {
      case 0:
        setCoinData(
          [...coins].sort((a, b) => {
            const numA = new BigNumber(a.displayValue);
            const numB = new BigNumber(b.displayValue);
            return numB.comparedTo(numA);
          })
        );
        break;

      case 1:
        setCoinData(
          [...coins].sort((a, b) => {
            const numA = new BigNumber(a.displayValue);
            const numB = new BigNumber(b.displayValue);
            return numA.comparedTo(numB);
          })
        );
        break;

      case 2:
        setCoinData(
          [...coins].sort((a, b) => {
            return a.name.localeCompare(b.name);
          })
        );
        break;

      case 3:
        setCoinData(
          [...coins].sort((a, b) => {
            return b.name.localeCompare(a.name);
          })
        );
        break;

      case 4:
        setCoinData(
          [...coins].sort((a, b) => {
            const numA = new BigNumber(a.displayBalance);
            const numB = new BigNumber(b.displayBalance);
            return numB.comparedTo(numA);
          })
        );
        break;

      case 5:
        setCoinData(
          [...coins].sort((a, b) => {
            const numA = new BigNumber(a.displayBalance);
            const numB = new BigNumber(b.displayBalance);
            return numA.comparedTo(numB);
          })
        );
        break;

      case 6:
        setCoinData(
          [...coins].sort((a, b) => {
            const numA = new BigNumber(a.displayPrice);
            const numB = new BigNumber(b.displayPrice);
            return numB.comparedTo(numA);
          })
        );
        break;

      case 7:
        setCoinData(
          [...coins].sort((a, b) => {
            const numA = new BigNumber(a.displayPrice);
            const numB = new BigNumber(b.displayPrice);
            return numA.comparedTo(numB);
          })
        );
        break;

      default:
        break;
    }
  };

  const sortCoinsByIndex: UseWalletDataValues['sortCoinsByIndex'] = index => {
    sortCoinData(coinData, index);
  };

  /**
   *
   * @param loader Set this flag to show spinner on the wallet view. Do not use
   * when the wallet/coin data is frequently updated like how it happens during
   * sync.
   */
  const getAllCoinsFromWallet = async (loader = false) => {
    if (currentWalletId) {
      if (loader) setIsLoading(true);
      const res = await accountDb.getAll({ walletId: currentWalletId });
      const coinList: Array<{
        id: string;
        accountIndex: number;
        accountType: string;
      }> = [];
      res.forEach(coin => {
        coinList.push({
          id: coin.coinId,
          accountIndex: coin.accountIndex,
          accountType: coin.accountType
        });
      });
      setCoinsPresent(coinList);
      const unsortedCoins = await getCoinsWithPrices(res);
      sortCoinData(unsortedCoins, sortIndex);
      if (loader) setIsLoading(false);
    }
  };

  const deleteCoinByXpub = async (accountId: string) => {
    await addressDb.delete({ accountId });
    await receiveAddressDb.delete({ accountId });
    await customAccountDb.delete({ accountId });
    await accountDb.delete({ accountId });
    refreshCoinsDebounced();
  };

  const onDBChange = () => {
    setDoRefresh(true);
  };

  const onChange = useDebouncedFunction(onDBChange, 800);
  const refreshCoinsDebounced = useDebouncedFunction(getAllCoinsFromWallet, 10);

  useEffect(() => {
    priceHistoryDb.emitter.on('insert', onChange);
    priceHistoryDb.emitter.on('update', onChange);

    accountDb.emitter.on('insert', onChange);
    accountDb.emitter.on('update', onChange);
    accountDb.emitter.on('delete', onChange);

    return () => {
      priceHistoryDb.emitter.removeListener('insert', onChange);
      priceHistoryDb.emitter.removeListener('update', onChange);

      accountDb.emitter.removeListener('insert', onChange);
      accountDb.emitter.removeListener('update', onChange);
      accountDb.emitter.removeListener('delete', onChange);
    };
  }, []);

  useEffect(() => {
    getAllCoinsFromWallet(true);
  }, [currentWalletId]);

  useEffect(() => {
    if (doRefresh) {
      setDoRefresh(false);
      refreshCoinsDebounced();
    }
  }, [doRefresh]);

  const refreshCoins = () => {
    getAllCoinsFromWallet();
  };

  return {
    coinData,
    setCoinData,
    coinsPresent,
    deleteCoinByXpub,
    setCurrentWalletId,
    currentWalletId,
    isLoading,
    refreshCoins,
    sortIndex,
    setSortIndex,
    sortCoinData,
    sortCoinsByIndex
  };
};
