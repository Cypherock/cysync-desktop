import { ALLCOINS as COINS } from '@cypherock/communication';
import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';

import {
  addressDb,
  getLatestPriceForCoin,
  priceDb,
  receiveAddressDb,
  Xpub,
  xpubDb
} from '../database';

import { DisplayCoin } from './types';
import { useDebouncedFunction } from './useDebounce';

export interface UseWalletDataValues {
  coinData: DisplayCoin[];
  setCoinData: React.Dispatch<React.SetStateAction<DisplayCoin[]>>;
  insert: (coin: Xpub) => Promise<void>;
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

  const [sortIndex, setSortIndex] = useState(0);

  // Using doRefresh mechanish because hooks state change do not work with event listeners.
  const [doRefresh, setDoRefresh] = useState(false);

  const insert = (coin: Xpub) => {
    return xpubDb.insert(coin);
  };

  const getCoinsWithPrices = async (coins: Xpub[]) => {
    const mappedCoins: DisplayCoin[] = [];

    for (const coin of coins) {
      const coinObj = COINS[coin.coin.toLowerCase()];
      if (!coinObj) {
        throw new Error(`Cannot find coinType: ${coin.coin}`);
      }

      const coinWithPrice: DisplayCoin = {
        ...coin,
        isEmpty: true,
        displayValue: '0',
        displayPrice: '0',
        displayBalance: '0'
      };
      const balance = new BigNumber(
        coin.totalBalance ? coin.totalBalance.balance : 0
      ).dividedBy(coinObj.multiplier);

      coinWithPrice.displayBalance = balance.toString();

      const latestPrice = await getLatestPriceForCoin(coin.coin);
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
            const numA = new BigNumber(a.coin);
            const numB = new BigNumber(b.coin);
            return numA.comparedTo(numB);
          })
        );
        break;

      case 3:
        setCoinData(
          [...coins].sort((a, b) => {
            const numA = new BigNumber(a.coin);
            const numB = new BigNumber(b.coin);
            return numB.comparedTo(numA);
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
      const res = await xpubDb.getByWalletId(currentWalletId);
      const coinList: string[] = [];
      res.forEach(coin => {
        coinList.push(coin.coin);
      });
      setCoinsPresent(coinList);
      const unsortedCoins = await getCoinsWithPrices(res);
      sortCoinData(unsortedCoins, sortIndex);
    }
  };

  const deleteCoinByXpub = async (
    xpub: string,
    coin: string,
    walletId: string
  ) => {
    await addressDb.deleteAll({ xpub, coinType: coin });
    await receiveAddressDb.deleteAll({ walletId, coinType: coin });
    await xpubDb.delete(xpub, coin);
    return getAllCoinsFromWallet();
  };

  const onDBChange = () => {
    setDoRefresh(true);
  };

  const onChange = useDebouncedFunction(onDBChange, 800);

  useEffect(() => {
    priceDb.emitter.on('insert', onChange);
    priceDb.emitter.on('update', onChange);

    xpubDb.emitter.on('insert', onChange);
    xpubDb.emitter.on('update', onChange);
    xpubDb.emitter.on('delete', onChange);

    return () => {
      priceDb.emitter.removeListener('insert', onChange);
      priceDb.emitter.removeListener('update', onChange);

      xpubDb.emitter.removeListener('insert', onChange);
      xpubDb.emitter.removeListener('update', onChange);
      xpubDb.emitter.removeListener('delete', onChange);
    };
  }, []);

  useEffect(() => {
    getAllCoinsFromWallet();
  }, [currentWalletId]);

  useEffect(() => {
    if (doRefresh) {
      setDoRefresh(false);
      getAllCoinsFromWallet();
    }
  }, [doRefresh]);

  const refreshCoins = () => {
    getAllCoinsFromWallet();
  };

  return {
    coinData,
    setCoinData,
    insert,
    coinsPresent,
    deleteCoinByXpub,
    setCurrentWalletId,
    currentWalletId,
    refreshCoins,
    sortIndex,
    setSortIndex,
    sortCoinData,
    sortCoinsByIndex
  } as UseWalletDataValues;
};
