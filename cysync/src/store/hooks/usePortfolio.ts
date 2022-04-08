import { ALLCOINS as COINS } from '@cypherock/communication';
import BigNumber from 'bignumber.js';
import { ipcRenderer } from 'electron';
import { useEffect, useState } from 'react';

import { getPortfolioCache } from '../../utils/cache';
import logger from '../../utils/logger';
import { Databases, dbUtil, Transaction } from '../database';

import { CoinDetails, CoinHistory, CoinPriceHistory } from './types';
import { useDebouncedFunction } from './useDebounce';

export interface UsePortfolioValues {
  coinList: string[];
  coinHistory: CoinHistory[];
  getAllCoinPriceHistory: (
    days: number,
    wallet?: string,
    isRefresh?: boolean
  ) => Promise<void>;
  coinsUserHas: (walletId?: string) => Promise<CoinDetails[]>;
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
  setSeries: React.Dispatch<React.SetStateAction<CoinHistory[]>>;
  setAllCoinSeries: () => void;
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
    ipcRenderer.on(`${Databases.ERC20TOKEN}-insert`, debouncedRefreshFromDB);
    ipcRenderer.on(`${Databases.ERC20TOKEN}-update`, debouncedRefreshFromDB);
    ipcRenderer.on(`${Databases.ERC20TOKEN}-delete`, debouncedRefreshFromDB);

    ipcRenderer.on(`${Databases.PRICE}-insert`, debouncedRefreshFromDB);
    ipcRenderer.on(`${Databases.PRICE}-update`, debouncedRefreshFromDB);
    ipcRenderer.on(`${Databases.PRICE}-delete`, debouncedRefreshFromDB);

    ipcRenderer.on(`${Databases.XPUB}-insert`, debouncedRefreshFromDB);
    ipcRenderer.on(`${Databases.XPUB}-update`, debouncedRefreshFromDB);
    ipcRenderer.on(`${Databases.XPUB}-delete`, debouncedRefreshFromDB);

    ipcRenderer.on(`${Databases.TRANSACTION}-insert`, debouncedRefreshFromDB);
    ipcRenderer.on(`${Databases.TRANSACTION}-update`, debouncedRefreshFromDB);
    ipcRenderer.on(`${Databases.TRANSACTION}-delete`, debouncedRefreshFromDB);
    
    return () => {

      ipcRenderer.removeListener(`${Databases.ERC20TOKEN}-insert`, debouncedRefreshFromDB);
      ipcRenderer.removeListener(`${Databases.ERC20TOKEN}-update`, debouncedRefreshFromDB);
      ipcRenderer.removeListener(`${Databases.ERC20TOKEN}-delete`, debouncedRefreshFromDB);

      ipcRenderer.removeListener(`${Databases.PRICE}-insert`, debouncedRefreshFromDB);
      ipcRenderer.removeListener(`${Databases.PRICE}-update`, debouncedRefreshFromDB);
      ipcRenderer.removeListener(`${Databases.PRICE}-delete`, debouncedRefreshFromDB);

      ipcRenderer.removeListener(`${Databases.XPUB}-insert`, debouncedRefreshFromDB);
      ipcRenderer.removeListener(`${Databases.XPUB}-update`, debouncedRefreshFromDB);
      ipcRenderer.removeListener(`${Databases.XPUB}-delete`, debouncedRefreshFromDB);
      
      ipcRenderer.removeListener(`${Databases.TRANSACTION}-insert`, debouncedRefreshFromDB);
      ipcRenderer.removeListener(`${Databases.TRANSACTION}-update`, debouncedRefreshFromDB);
      ipcRenderer.removeListener(`${Databases.TRANSACTION}-delete`, debouncedRefreshFromDB);
    };
  }, []);

  const getCoinPriceHistory = async (
    coinType: string,
    days: number,
    wallet = ''
  ) => {
    const coin = COINS[coinType];
    if (!coin) {
      throw new Error(`Cannot find coinType: ${coinType}`);
    }

    let totalBalance = new BigNumber(0);
    const allPrices = await dbUtil(Databases.PRICE, 'getPrice', coinType, days);
    if (!allPrices) {
      return null;
    }

    const latestUnitPrices = allPrices.data;
    const computedPrices = JSON.parse(
      JSON.stringify(latestUnitPrices)
    ) as number[][];
    let transactionHistory: Transaction[] = [];

    if (wallet && wallet !== 'null') {
      if (coin.isErc20Token) {
        const token = await dbUtil(
          Databases.ERC20TOKEN,
          'getByWalletIdandToken',
          wallet,
          coinType
        );
        if (token) totalBalance = new BigNumber(token.balance);
        else return null;
      } else {
        const xpub = await dbUtil(
          Databases.XPUB,
          'getByWalletIdandCoin',
          wallet,
          coinType
        );
        if (xpub)
          totalBalance = new BigNumber(
            xpub.totalBalance ? xpub.totalBalance.balance : 0
          );
        else return null;
      }

      transactionHistory = await dbUtil(
        Databases.TRANSACTION,
        'getAll',
        {
          walletId: wallet,
          coin: coinType,
          excludeFailed: true,
          excludePending: true
        },
        { sort: 'confirmed', order: 'd' }
      );
    } else {
      if (coin.isErc20Token) {
        const tokens = await dbUtil(
          Databases.ERC20TOKEN,
          'getByToken',
          coinType
        );
        if (tokens.length === 0) return null;
        for (const token of tokens) {
          totalBalance = totalBalance.plus(token.balance);
        }
      } else {
        const allCoins = await dbUtil(Databases.XPUB, 'getByCoin', coinType);
        if (!allCoins || allCoins.length === 0) return null;
        for (const xpub of allCoins) {
          totalBalance = totalBalance.plus(
            xpub.totalBalance ? xpub.totalBalance.balance : 0
          );
        }
      }

      transactionHistory = await dbUtil(
        Databases.TRANSACTION,
        'getAll',
        { coin: coinType, excludeFailed: true, excludePending: true },
        { sort: 'confirmed', order: 'd' }
      );
    }

    let prevTransactionIndex: number | null = null;
    let prevTransactionAmount = new BigNumber(0);

    for (let i = latestUnitPrices.length - 1; i >= 0; i -= 1) {
      let balance = totalBalance;
      if (
        !(computedPrices[i] && computedPrices[i][0] && computedPrices[i][1])
      ) {
        logger.warn('Unexpected price from database', {
          price: computedPrices[i],
          coin: coinType,
          days,
          wallet
        });
        continue;
      }

      for (
        let j = prevTransactionIndex === null ? 0 : prevTransactionIndex + 1;
        j < transactionHistory.length;
        j += 1
      ) {
        const transaction = transactionHistory[j];

        if (transaction.confirmed) {
          const transactionTime = new Date(transaction.confirmed).getTime();
          if (computedPrices[i][0] <= transactionTime) {
            if (transaction.sentReceive === 'SENT') {
              prevTransactionAmount = prevTransactionAmount.plus(
                new BigNumber(transaction.amount)
              );
              if (!coin.isErc20Token) {
                prevTransactionAmount = prevTransactionAmount.plus(
                  new BigNumber(transaction.fees || 0)
                );
              }
            } else if (transaction.sentReceive === 'FEES') {
              prevTransactionAmount = prevTransactionAmount.plus(
                new BigNumber(transaction.amount)
              );
            } else {
              prevTransactionAmount = prevTransactionAmount.minus(
                new BigNumber(transaction.amount)
              );
            }

            prevTransactionIndex = j;
          } else {
            break;
          }
        }
      }

      balance = balance.plus(prevTransactionAmount);

      computedPrices[i][1] = balance
        .multipliedBy(computedPrices[i][1])
        .dividedBy(coin.multiplier)
        .toNumber();
    }

    return {
      totalBalance,
      unitPrices: latestUnitPrices,
      pricesToDisplay: computedPrices
    } as CoinPriceHistory;
  };

  const getAllCoinPriceHistory = async (
    days: number,
    wallet = '',
    isRefresh = false
  ) => {
    const key = `${wallet}-${days}`;
    if (!isRefresh) {
      const cacheData:
        | undefined
        | {
            prevTotal: number;
            allCoinList: string[];
            allCoinPriceHistory: CoinHistory[];
          } = getPortfolioCache(key) as any;

      if (
        cacheData &&
        cacheData.prevTotal !== undefined &&
        cacheData.allCoinList !== undefined &&
        cacheData.allCoinPriceHistory !== undefined
      ) {
        logger.info('Getting graph from cache');
        setOldTotalPrice(cacheData.prevTotal);
        setCoinList(cacheData.allCoinList);
        setCoinHistory(cacheData.allCoinPriceHistory);
        return;
      }
    }

    logger.info('Computing graph data');

    const allCoinPriceHistory: CoinHistory[] = [];
    const allCoinList: string[] = ['All Coins'];
    let prevTotal = new BigNumber(0);

    for (const coinType of Object.keys(COINS)) {
      const coin = COINS[coinType];
      if (!coin) {
        continue;
      }
      if (coin.isTest) continue;
      const coinPrices = await getCoinPriceHistory(coinType, days, wallet);
      if (!coinPrices || !coinPrices.pricesToDisplay) continue;

      allCoinList.push(coinType);
      const tempCoin: CoinHistory = {
        name: coinType,
        data: coinPrices.pricesToDisplay
      };

      allCoinPriceHistory.push(tempCoin);

      if (!coinPrices.unitPrices[0]) {
        logger.warn('Unexpected unitPrices variable', {
          unitPrices: coinPrices.unitPrices,
          coinType,
          days,
          wallet
        });
        continue;
      }

      prevTotal = prevTotal.plus(coinPrices.pricesToDisplay[0][1]);
    }

    setOldTotalPrice(prevTotal.toNumber());
    setCoinList(allCoinList);
    setCoinHistory(allCoinPriceHistory);
  };

  // returns a list of all coins with their balances and value (eg, if there are 2 bitcoins in 2 different wallet, it will return a value of total if wallet is null
  const coinsUserHas: UsePortfolioValues['coinsUserHas'] = async (
    walletId = ''
  ) => {
    return new Promise(async resolve => {
      const allCoinholding: number[] = [];
      const setOfCoins: CoinDetails[] = [];

      for (const coinType of Object.keys(COINS)) {
        const coin = COINS[coinType];
        if (!coin) {
          throw new Error(`Cannot find coinType: ${coinType}`);
        }
        let totalBalance = new BigNumber(0);
        const currentTempCoin: CoinDetails = {
          name: coinType,
          decimal: coin.decimal,
          balance: '0',
          value: '0',
          price: '0'
        };

        if (walletId && walletId !== 'null') {
          if (coin.isErc20Token) {
            const token = await dbUtil(
              Databases.ERC20TOKEN,
              'getByWalletIdandToken',
              walletId,
              coinType
            );
            if (token) totalBalance = new BigNumber(token.balance);
            else continue;
          } else {
            const xpub = await dbUtil(
              Databases.XPUB,
              'getByWalletIdandCoin',
              walletId,
              coinType
            );
            if (xpub)
              totalBalance = new BigNumber(
                xpub.totalBalance ? xpub.totalBalance.balance : 0
              );
            else continue;
          }
        } else if (coin.isErc20Token) {
          const tokens = await dbUtil(
            Databases.ERC20TOKEN,
            'getByToken',
            coinType
          );
          if (tokens.length === 0) continue;
          for (const token of tokens) {
            totalBalance = totalBalance.plus(token.balance);
          }
        } else {
          const coinsFromDB = await dbUtil(
            Databases.XPUB,
            'getByCoin',
            coinType
          );
          if (coinsFromDB.length === 0) continue;
          for (const c of coinsFromDB) {
            totalBalance = totalBalance.plus(
              c.totalBalance ? c.totalBalance.balance : 0
            );
          }
        }

        if (!hasCoins) {
          setHasCoins(true);
        }

        const res = await dbUtil(Databases.PRICE, 'getPrice', coinType, 7);

        let latestPrice = 0;
        if (res && res.data) {
          const latestUnitPrices = res.data;
          if (!latestUnitPrices[latestUnitPrices.length - 1]) {
            logger.warn('Unexpected latestUnitPrice from DB', {
              latestUnitPrices,
              coinType
            });
          } else {
            latestPrice = latestUnitPrices[latestUnitPrices.length - 1][1];
          }
        }

        const balance = totalBalance.dividedBy(coin.multiplier);

        currentTempCoin.balance = balance.toString();

        const value = balance.multipliedBy(latestPrice).toNumber();

        currentTempCoin.value = value.toFixed(3);

        currentTempCoin.price = latestPrice.toString();

        // Don't add coins to holdings (This will not display the coin in chart)
        if (!coin.isTest) {
          allCoinholding.push(parseFloat(value.toFixed(3)));
        }

        setOfCoins.push(currentTempCoin);
      }
      setCoinHolding(allCoinholding);
      resolve(setOfCoins);
    });
  };

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

  useEffect(() => {
    coinsUserHas(currentWallet)
      .then(res => {
        setTotal(
          parseFloat(
            res.reduce(
              (a, b) => new BigNumber(a).plus(b.value || 0).toString(),
              '0'
            )
          )
        );
        const sortedCoins = res.sort((a, b) =>
          new BigNumber(b.value).minus(a.value).toNumber()
        );
        setCoins([...sortedCoins]);
      })
      .catch(error => {
        logger.error(error);
      });
    getAllCoinPriceHistory(timeActiveButton, currentWallet);
  }, [currentWallet]);

  useEffect(() => {
    if (doRefresh) {
      setDoRefresh(false);
      coinsUserHas(currentWallet)
        .then(res => {
          setTotal(
            parseFloat(
              res.reduce(
                (a, b) => new BigNumber(a).plus(b.value || 0).toString(),
                '0'
              )
            )
          );
          const sortedCoins = res.sort((a, b) =>
            new BigNumber(b.value).minus(a.value).toNumber()
          );
          setCoins([...sortedCoins]);
        })
        .catch(error => {
          logger.error(error);
        });
      getAllCoinPriceHistory(timeActiveButton, currentWallet, true);
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
    getAllCoinPriceHistory(timeActiveButton, currentWallet);
  }, [timeActiveButton]);

  useEffect(() => {
    if (coinIndex === 0) setAllCoinSeries();
    else setSeries([coinHistory[coinIndex - 1]]);
  }, [coinHistory, coinIndex]);

  return {
    coinList,
    coinHistory,
    getAllCoinPriceHistory,
    coinsUserHas,
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
    setSeries,
    setAllCoinSeries
  } as UsePortfolioValues;
};
