import { ALLCOINS as COINS } from '@cypherock/communication';
import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';

import {
  addressDb,
  Coin,
  coinDb,
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
  coinsPresent: string[];
  deleteCoinByXpub: (
    xpub: string,
    coin: string,
    walletId: string
  ) => Promise<void>;
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
  const [coinsPresent, setCoinsPresent] = useState<string[]>([]);

  const [currentWalletId, setCurrentWalletId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [sortIndex, setSortIndex] = useState(0);

  // Using doRefresh mechanish because hooks state change do not work with event listeners.
  const [doRefresh, setDoRefresh] = useState(false);

  const getCoinsWithPrices = async (coins: Coin[]) => {
    const mappedCoins: DisplayCoin[] = [];

    for (const coin of coins) {
      const coinObj = COINS[coin.slug];
      if (!coinObj) {
        throw new Error(`Cannot find coinType: ${coin.slug}`);
      }

      const coinWithPrice: DisplayCoin = {
        ...coin,
        isEmpty: true,
        displayValue: '0',
        displayPrice: '0',
        displayBalance: '0'
      };
      const balance = new BigNumber(
        coin.totalBalance ? coin.totalBalance : 0
      ).dividedBy(coinObj.multiplier);

      coinWithPrice.displayBalance = balance.toString();

      const latestPrice = await getLatestPriceForCoin(coin.slug);
      const value = balance.multipliedBy(latestPrice || 0);
      coinWithPrice.displayValue = value.toFixed(2);
      coinWithPrice.displayPrice = latestPrice.toFixed(2) || '0';
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
            return a.slug.localeCompare(b.slug);
          })
        );
        break;

      case 3:
        setCoinData(
          [...coins].sort((a, b) => {
            return b.slug.localeCompare(a.slug);
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

  const getAllCoinsFromWallet = async () => {
    if (currentWalletId) {
      setIsLoading(true);
      const res = await coinDb.getAll({ walletId: currentWalletId });
      const coinList: string[] = [];
      res.forEach(coin => {
        coinList.push(coin.slug);
      });
      setCoinsPresent(coinList);
      const unsortedCoins = await getCoinsWithPrices(res);
      sortCoinData(unsortedCoins, sortIndex);
      setIsLoading(false);
    }
  };

  const deleteCoinByXpub = async (
    xpub: string,
    coin: string,
    walletId: string
  ) => {
    await addressDb.delete({ walletId, coinType: coin });
    await receiveAddressDb.delete({ walletId, coinType: coin });
    await coinDb.delete({ xpub, slug: coin });
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

    coinDb.emitter.on('insert', onChange);
    coinDb.emitter.on('update', onChange);
    coinDb.emitter.on('delete', onChange);

    return () => {
      priceHistoryDb.emitter.removeListener('insert', onChange);
      priceHistoryDb.emitter.removeListener('update', onChange);

      coinDb.emitter.removeListener('insert', onChange);
      coinDb.emitter.removeListener('update', onChange);
      coinDb.emitter.removeListener('delete', onChange);
    };
  }, []);

  useEffect(() => {
    getAllCoinsFromWallet();
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
