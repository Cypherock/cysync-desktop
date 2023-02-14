import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';

import logger from '../../utils/logger';
import {
  accountDb,
  coinPriceDb,
  priceHistoryDb,
  tokenDb,
  transactionDb
} from '../database';

import { getCoinData } from './helper/portfolio';
import { CoinDetails, CoinHistory } from './types';
import { useDebouncedFunction } from './useDebounce';

export interface UsePortfolioValues {
  coinList: string[];
  coinHistory: CoinHistory[];
  coinHolding: number[];
  oldTotalPrice: number;
  hasCoins: boolean;
  sortIndex: number;
  setSortIndex: React.Dispatch<React.SetStateAction<number>>;
  total: number;
  setTotal: React.Dispatch<React.SetStateAction<number>>;
  coins: CoinDetails[];
  setCoins: React.Dispatch<React.SetStateAction<CoinDetails[]>>;
  currentWallet: string;
  setCurrentWallet: React.Dispatch<React.SetStateAction<string>>;
  timeActiveButton: number;
  setTimeActive: React.Dispatch<React.SetStateAction<number>>;
  sinceText: string;
  setSinceText: React.Dispatch<React.SetStateAction<string>>;
  coinIndex: number;
  setCoinIndex: React.Dispatch<React.SetStateAction<number>>;
  sinceLastTotalPrice: number;
  setSinceLastTotalPrice: React.Dispatch<React.SetStateAction<number>>;
  series: CoinHistory[];
  isLoading: boolean;
}

export type UsePortfolio = () => UsePortfolioValues;

export const usePortfolio: UsePortfolio = () => {
  const [coinHistory, setCoinHistory] = useState<
    UsePortfolioValues['coinHistory']
  >([]);
  const [coinList, setCoinList] = useState<UsePortfolioValues['coinList']>([]);
  const [coinHolding, setCoinHolding] = useState<
    UsePortfolioValues['coinHolding']
  >([]);
  const [oldTotalPrice, setOldTotalPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCoins, setHasCoins] = useState(false);
  const [coins, setCoins] = useState<UsePortfolioValues['coins']>([]);
  const [total, setTotal] = useState(0);
  const [sortIndex, setSortIndex] = useState(0);
  const [currentWallet, setCurrentWallet] = useState('');
  const [timeActiveButton, setTimeActive] = useState(7);
  const [sinceText, setSinceText] = useState('Since Last Week');
  const [sinceLastTotalPrice, setSinceLastTotalPrice] = useState(0);
  const [coinIndex, setCoinIndex] = useState(0);
  const [series, setSeries] = useState([...coinHistory]);

  // Using doRefresh mechanish because hooks state change do not work with event listeners.
  const [doRefresh, setDoRefresh] = useState(false);

  const refreshFromDB = () => {
    setDoRefresh(true);
  };

  const debouncedRefreshFromDB = useDebouncedFunction(refreshFromDB, 2000);

  useEffect(() => {
    tokenDb.emitter.on('insert', debouncedRefreshFromDB);
    tokenDb.emitter.on('update', debouncedRefreshFromDB);
    tokenDb.emitter.on('delete', debouncedRefreshFromDB);

    priceHistoryDb.emitter.on('insert', debouncedRefreshFromDB);
    priceHistoryDb.emitter.on('update', debouncedRefreshFromDB);
    priceHistoryDb.emitter.on('delete', debouncedRefreshFromDB);

    accountDb.emitter.on('insert', debouncedRefreshFromDB);
    accountDb.emitter.on('update', debouncedRefreshFromDB);
    accountDb.emitter.on('delete', debouncedRefreshFromDB);

    coinPriceDb.emitter.on('insert', debouncedRefreshFromDB);
    coinPriceDb.emitter.on('update', debouncedRefreshFromDB);
    coinPriceDb.emitter.on('delete', debouncedRefreshFromDB);

    transactionDb.emitter.on('insert', debouncedRefreshFromDB);
    transactionDb.emitter.on('update', debouncedRefreshFromDB);
    transactionDb.emitter.on('delete', debouncedRefreshFromDB);

    return () => {
      tokenDb.emitter.removeListener('insert', debouncedRefreshFromDB);
      tokenDb.emitter.removeListener('update', debouncedRefreshFromDB);
      tokenDb.emitter.removeListener('delete', debouncedRefreshFromDB);

      priceHistoryDb.emitter.removeListener('insert', debouncedRefreshFromDB);
      priceHistoryDb.emitter.removeListener('update', debouncedRefreshFromDB);
      priceHistoryDb.emitter.removeListener('delete', debouncedRefreshFromDB);

      accountDb.emitter.removeListener('insert', debouncedRefreshFromDB);
      accountDb.emitter.removeListener('update', debouncedRefreshFromDB);
      accountDb.emitter.removeListener('delete', debouncedRefreshFromDB);

      coinPriceDb.emitter.removeListener('insert', debouncedRefreshFromDB);
      coinPriceDb.emitter.removeListener('update', debouncedRefreshFromDB);
      coinPriceDb.emitter.removeListener('delete', debouncedRefreshFromDB);

      transactionDb.emitter.removeListener('insert', debouncedRefreshFromDB);
      transactionDb.emitter.removeListener('update', debouncedRefreshFromDB);
      transactionDb.emitter.removeListener('delete', debouncedRefreshFromDB);
    };
  }, []);

  const sortCoins = (coinsToSort: CoinDetails[], index: number) => {
    let compareFunc: (a: CoinDetails, b: CoinDetails) => number;

    switch (index) {
      case 0:
        compareFunc = (a, b) => {
          const numA = new BigNumber(a.value);
          const numB = new BigNumber(b.value);
          return numB.comparedTo(numA);
        };
        break;

      case 1:
        compareFunc = (a, b) => {
          const numA = new BigNumber(a.value);
          const numB = new BigNumber(b.value);
          return numA.comparedTo(numB);
        };
        break;

      case 2:
        compareFunc = (a, b) => {
          if (a.name > b.name) return 1;
          if (a.name < b.name) return -1;
          return 0;
        };
        break;

      case 3:
        compareFunc = (a, b) => {
          if (a.name > b.name) return -1;
          if (a.name < b.name) return 1;
          return 0;
        };
        break;

      case 4:
        compareFunc = (a, b) => {
          const numA = new BigNumber(a.balance);
          const numB = new BigNumber(b.balance);
          return numB.comparedTo(numA);
        };
        break;

      case 5:
        compareFunc = (a, b) => {
          const numA = new BigNumber(a.balance);
          const numB = new BigNumber(b.balance);
          return numA.comparedTo(numB);
        };
        break;

      case 6:
        compareFunc = (a, b) => {
          const numA = new BigNumber(a.price);
          const numB = new BigNumber(b.price);
          return numB.comparedTo(numA);
        };
        break;

      case 7:
        compareFunc = (a, b) => {
          const numA = new BigNumber(a.price);
          const numB = new BigNumber(b.price);
          return numA.comparedTo(numB);
        };
        break;

      case 8:
        compareFunc = (a, b) => {
          const numA = new BigNumber(a.value).dividedBy(total);
          const numB = new BigNumber(b.value).dividedBy(total);
          return numB.comparedTo(numA);
        };
        break;

      case 9:
        compareFunc = (a, b) => {
          const numA = new BigNumber(a.value).dividedBy(total);
          const numB = new BigNumber(b.value).dividedBy(total);
          return numA.comparedTo(numB);
        };
        break;

      default:
        break;
    }

    setCoins([...coinsToSort].sort(compareFunc));
  };

  const setAllCoinSeries = () => {
    if (coinHistory.length > 0) {
      let maxLen = 0;
      for (let i = 1; i < coinHistory.length; i += 1) {
        if (coinHistory[i].data.length > maxLen) {
          maxLen = coinHistory[i].data.length;
        }
      }
      for (let i = 0; i < coinHistory.length; i += 1) {
        if (coinHistory[i].data.length < maxLen) {
          const diffLen = maxLen - coinHistory[i].data.length;
          for (let j = 0; j < diffLen; j += 1) {
            coinHistory[i].data.push(
              coinHistory[i].data[coinHistory[i].data.length - 1]
            );
          }
        }
      }
      const allCoinHistoryData = JSON.parse(
        JSON.stringify(coinHistory[0].data)
      );
      for (let i = 1; i < coinHistory.length; i += 1) {
        for (let j = 0; j < coinHistory[i].data.length; j += 1) {
          allCoinHistoryData[j][1] += coinHistory[i].data[j][1];
        }
      }
      setSeries([{ name: 'All Coins', data: allCoinHistoryData }]);
      setCoinIndex(0);
    }
  };

  const computeGraphData = (params?: {
    isRefresh?: boolean;
    onlyGraphChange?: boolean;
    noLoader?: boolean;
  }) => {
    if (!params?.noLoader) {
      setIsLoading(true);
    }

    getCoinData({
      days: timeActiveButton,
      walletId: currentWallet,
      isRefresh: params?.isRefresh,
      onlyGraphChange: params?.onlyGraphChange
    })
      .then(result => {
        if (result.totalAmount !== undefined) {
          setTotal(result.totalAmount);
        }
        if (result.setOfCoins !== undefined) {
          sortCoins(result.setOfCoins, sortIndex);
        }
        if (result.allCoinholding !== undefined) {
          setCoinHolding(result.allCoinholding);
        }

        setOldTotalPrice(result.oldTotalPrice);
        setCoinList(result.coinList);
        setCoinHistory(result.coinHistory);

        setHasCoins(result.hasCoins);
      })
      .catch(error => {
        logger.error('Error in calculating portfolio data');
        logger.error(error);
      })
      .finally(() => {
        if (!params?.noLoader) {
          setIsLoading(false);
        }
      });
  };

  useEffect(() => {
    computeGraphData();
  }, [currentWallet]);

  useEffect(() => {
    if (doRefresh) {
      setDoRefresh(false);
      computeGraphData({ isRefresh: true, noLoader: true });
    }
  }, [doRefresh]);

  useEffect(() => {
    sortCoins(coins, sortIndex);
  }, [sortIndex]);

  useEffect(() => {
    let sinceLast = 0;
    if (coinIndex !== 0) {
      if (coinHistory[coinIndex - 1].data) {
        sinceLast =
          coinHistory[coinIndex - 1].data[
            coinHistory[coinIndex - 1].data.length - 1
          ][1] - coinHistory[coinIndex - 1].data[0][1];
      } else {
        sinceLast = 0;
      }
    } else {
      sinceLast =
        coinHolding.reduce((a, b) => {
          return a + b;
        }, 0) - oldTotalPrice;
    }
    setSinceLastTotalPrice(sinceLast);
  }, [coinHolding, oldTotalPrice, coinIndex, currentWallet, timeActiveButton]);

  useEffect(() => {
    let text = '';
    switch (timeActiveButton) {
      case 7:
        text = 'Since Last Week';
        break;
      case 30:
        text = 'Since Last Month';
        break;
      case 365:
        text = 'Since Last Year';
        break;
      default:
        text = '';
    }

    setSinceText(text);
    computeGraphData({ onlyGraphChange: true });
  }, [timeActiveButton]);

  useEffect(() => {
    if (coinIndex === 0) setAllCoinSeries();
    else setSeries([coinHistory[coinIndex - 1]]);
  }, [coinHistory, coinIndex]);

  return {
    coinList,
    coinHistory,
    coinHolding,
    oldTotalPrice,
    hasCoins,
    sortIndex,
    setSortIndex,
    total,
    setTotal,
    coins,
    setCoins,
    currentWallet,
    setCurrentWallet,
    timeActiveButton,
    setTimeActive,
    sinceText,
    setSinceText,
    coinIndex,
    setCoinIndex,
    sinceLastTotalPrice,
    setSinceLastTotalPrice,
    series,
    isLoading
  };
};
