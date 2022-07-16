import { CoinGroup, COINS, EthCoinData } from '@cypherock/communication';
import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';

import { getPortfolioCache } from '../../utils/cache';
import logger from '../../utils/logger';
import {
  coinDb,
  getAllTxns,
  getLatestPriceForCoin,
  priceHistoryDb,
  SentReceive,
  tokenDb,
  Transaction,
  transactionDb
} from '../database';

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
    priceHistoryDb.emitter.on('insert', debouncedRefreshFromDB);
    priceHistoryDb.emitter.on('update', debouncedRefreshFromDB);

    coinDb.emitter.on('update', debouncedRefreshFromDB);
    coinDb.emitter.on('delete', debouncedRefreshFromDB);
    coinDb.emitter.on('delete', debouncedRefreshFromDB);

    transactionDb.emitter.on('insert', debouncedRefreshFromDB);
    transactionDb.emitter.on('update', debouncedRefreshFromDB);
    transactionDb.emitter.on('delete', debouncedRefreshFromDB);

    return () => {
      tokenDb.emitter.removeListener('insert', debouncedRefreshFromDB);
      tokenDb.emitter.removeListener('update', debouncedRefreshFromDB);
      tokenDb.emitter.removeListener('delete', debouncedRefreshFromDB);

      priceHistoryDb.emitter.removeListener('insert', debouncedRefreshFromDB);
      priceHistoryDb.emitter.removeListener('insert', debouncedRefreshFromDB);
      priceHistoryDb.emitter.removeListener('update', debouncedRefreshFromDB);

      coinDb.emitter.removeListener('update', debouncedRefreshFromDB);
      coinDb.emitter.removeListener('delete', debouncedRefreshFromDB);
      coinDb.emitter.removeListener('delete', debouncedRefreshFromDB);

      transactionDb.emitter.removeListener('insert', debouncedRefreshFromDB);
      transactionDb.emitter.removeListener('update', debouncedRefreshFromDB);
      transactionDb.emitter.removeListener('delete', debouncedRefreshFromDB);
    };
  }, []);

  const getCoinPriceHistory = async (
    coinType: string,
    days: number,
    wallet = '',
    parent?: string
  ) => {
    let coinData;
    if (parent) {
      const parentData = COINS[parent] as EthCoinData;
      if (!parentData) throw new Error(`Parent coin ${parent} not found`);
      coinData = parentData.erc20TokensList[coinType];
    } else coinData = COINS[coinType];
    if (!coinData) {
      throw new Error(`Cannot find coinType: ${coinType}`);
    }

    let totalBalance = new BigNumber(0);
    const allPrices = await priceHistoryDb.getOne({
      slug: coinType,
      interval: days
    });
    if (!allPrices) {
      return null;
    }

    const latestUnitPrices = allPrices.data;
    const computedPrices = JSON.parse(
      JSON.stringify(latestUnitPrices)
    ) as number[][];
    let transactionHistory: Transaction[] = [];
    const lastSinceDate = new Date();
    lastSinceDate.setDate(lastSinceDate.getDate() - days);

    if (wallet && wallet !== 'null') {
      if (coinData.group === CoinGroup.ERC20Tokens) {
        const token = await tokenDb.getOne({
          walletId: wallet,
          slug: coinType
        });
        if (token) totalBalance = new BigNumber(token.balance);
        else return null;
      } else {
        const coin = await coinDb.getOne({ walletId: wallet, slug: coinType });
        if (coin)
          totalBalance = new BigNumber(
            coin.totalBalance ? coin.totalBalance : 0
          );
        else return null;
      }

      transactionHistory = await getAllTxns(
        {
          walletId: wallet,
          slug: coinType
        },
        {
          excludeFailed: true,
          excludePending: true,
          sinceDate: lastSinceDate
        },
        {
          field: 'confirmed',
          order: 'asc'
        }
      );
    } else {
      if (coinData.group === CoinGroup.ERC20Tokens) {
        const tokens = await tokenDb.getAll({ slug: coinType });
        if (tokens.length === 0) return null;
        for (const token of tokens) {
          totalBalance = totalBalance.plus(token.balance);
        }
      } else {
        const allCoins = await coinDb.getAll({ slug: coinType });
        if (allCoins.length === 0) return null;
        for (const coin of allCoins) {
          totalBalance = totalBalance.plus(
            coin.totalBalance ? coin.totalBalance : 0
          );
        }
      }

      transactionHistory = await getAllTxns(
        {
          slug: coinType
        },
        {
          excludeFailed: true,
          excludePending: true,
          sinceDate: lastSinceDate
        },
        {
          field: 'confirmed',
          order: 'asc'
        }
      );
    }

    let curBalance = totalBalance;

    for (
      let tIndex = transactionHistory.length - 1,
        pIndex = latestUnitPrices.length - 1;
      tIndex >= 0 && pIndex > 0;
      pIndex--
    ) {
      const transaction = transactionHistory[tIndex];
      if (transaction.confirmed) {
        const transactionTime = new Date(transaction.confirmed).getTime();
        const prevPricePoint = computedPrices[pIndex - 1][0];
        const thisPricePoint = computedPrices[pIndex][0];

        if (
          prevPricePoint < transactionTime &&
          transactionTime <= thisPricePoint
        ) {
          if (transaction.sentReceive === SentReceive.SENT) {
            curBalance = curBalance.plus(new BigNumber(transaction.amount));
            if (coinData.group === CoinGroup.ERC20Tokens) {
              curBalance = curBalance.plus(
                // TODO: for now using eth as default as there is no parent
                // token mapping available. Please remodify this to fetch
                // the parent coin and then its multiplier
                new BigNumber(transaction.fees || 0)
                  .dividedBy(COINS.eth.multiplier)
                  .multipliedBy(coinData.multiplier)
              );
            } else {
              curBalance = curBalance.plus(new BigNumber(transaction.fees));
            }
          } else if (transaction.sentReceive === SentReceive.FEES) {
            curBalance = curBalance.plus(new BigNumber(transaction.amount));
          } else {
            curBalance = curBalance.minus(new BigNumber(transaction.amount));
          }
          tIndex--;
        }
      }
      computedPrices[pIndex][1] = curBalance
        .multipliedBy(computedPrices[pIndex][1])
        .dividedBy(coinData.multiplier)
        .toNumber();
    }
    computedPrices[0][1] = curBalance
      .multipliedBy(computedPrices[0][1])
      .dividedBy(coinData.multiplier)
      .toNumber();

    return {
      totalBalance,
      unitPrices: latestUnitPrices,
      pricesToDisplay: computedPrices
    } as CoinPriceHistory;
  };

  const getAllCoinPriceHistory = async (
    days: number,
    wallet = '',
    isRefresh = false,
    loader = true
  ) => {
    if (loader) setIsLoading(true);
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
    const allCoins = await coinDb.getAll();
    const allTokens = await tokenDb.getAll();
    const allItems = [
      ...allCoins
        .map(coin => {
          return { parent: undefined, slug: coin.slug };
        })
        .filter((coin, index, self) => self.indexOf(coin) === index),
      ...allTokens
        .map(token => {
          return { parent: token.coin, slug: token.slug };
        })
        .filter((token, index, self) => self.indexOf(token) === index)
    ];

    for (const item of allItems) {
      let coin;
      if (item.parent) {
        const parent = COINS[item.parent];
        coin = (parent as EthCoinData).erc20TokensList[item.slug];
      } else {
        coin = COINS[item.slug];
      }

      if (!coin) {
        continue;
      }
      if (coin.isTest) continue;
      const coinPrices = await getCoinPriceHistory(
        item.slug,
        days,
        wallet,
        item.parent
      );
      if (!coinPrices || !coinPrices.pricesToDisplay) continue;

      allCoinList.push(item.slug);
      const tempCoin: CoinHistory = {
        name: item.slug,
        data: coinPrices.pricesToDisplay
      };

      allCoinPriceHistory.push(tempCoin);

      if (!coinPrices.unitPrices[0]) {
        logger.warn('Unexpected unitPrices variable', {
          unitPrices: coinPrices.unitPrices,
          item,
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
    if (loader) setIsLoading(false);
  };

  // returns a list of all coins with their balances and value (eg, if there are 2 bitcoins in 2 different wallet, it will return a value of total if wallet is null
  const coinsUserHas: UsePortfolioValues['coinsUserHas'] = async (
    walletId = ''
  ) => {
    return new Promise(async resolve => {
      const allCoinholding: number[] = [];
      const setOfCoins: CoinDetails[] = [];

      const allCoins = await coinDb.getAll();
      const allTokens = await tokenDb.getAll();
      const allItems = [
        ...allCoins
          .map(coin => {
            return { parent: undefined, slug: coin.slug };
          })
          .filter((coin, index, self) => self.indexOf(coin) === index),
        ...allTokens
          .map(token => {
            return { parent: token.coin, slug: token.slug };
          })
          .filter((token, index, self) => self.indexOf(token) === index)
      ];
      for (const item of allItems) {
        let coinData;
        if (item.parent) {
          const parent = COINS[item.parent];
          if (!parent) {
            throw new Error(`Cannot find coinType: ${item.parent}`);
          }

          coinData = (parent as EthCoinData).erc20TokensList[item.slug];
        } else {
          coinData = COINS[item.slug];
        }
        if (!coinData) {
          throw new Error(`Cannot find coinType: ${item.slug}`);
        }
        let totalBalance = new BigNumber(0);
        const currentTempCoin: CoinDetails = {
          name: item.slug,
          parent: item.parent,
          decimal: coinData.decimal,
          balance: '0',
          value: '0',
          price: '0'
        };

        if (walletId && walletId !== 'null') {
          if (coinData.group === CoinGroup.ERC20Tokens) {
            const token = await tokenDb.getOne({
              walletId,
              slug: item.slug
            });
            if (token) totalBalance = new BigNumber(token.balance);
            else continue;
          } else {
            const xpub = await coinDb.getOne({ walletId, slug: item.slug });
            if (xpub)
              totalBalance = new BigNumber(
                xpub.totalBalance ? xpub.totalBalance : 0
              );
            else continue;
          }
        }
        if (coinData.group === CoinGroup.ERC20Tokens) {
          const tokens = await tokenDb.getAll({ slug: item.slug });
          if (tokens.length === 0) continue;
          for (const token of tokens) {
            totalBalance = totalBalance.plus(token.balance);
          }
        } else {
          const coinsData = await coinDb.getAll({ slug: item.slug });
          if (coinsData.length === 0) continue;
          for (const coin of coinsData) {
            totalBalance = totalBalance.plus(
              coin.totalBalance ? coin.totalBalance : 0
            );
          }
        }

        if (!hasCoins) {
          setHasCoins(true);
        }

        const res = await priceHistoryDb.getOne({
          slug: item.slug,
          interval: 7
        });

        if (res && res.data) {
          const latestUnitPrices = res.data;
          if (!latestUnitPrices[latestUnitPrices.length - 1]) {
            logger.warn('Unexpected latestUnitPrice from DB', {
              latestUnitPrices,
              slug: item.slug
            });
          }
        }

        const latestPrice = await getLatestPriceForCoin(item.slug, item.parent);

        const balance = totalBalance.dividedBy(coinData.multiplier);

        currentTempCoin.balance = balance.toString();

        const value = balance.multipliedBy(latestPrice).toNumber();

        currentTempCoin.value = value.toFixed(3);

        currentTempCoin.price = latestPrice.toString();

        // Don't add coins to holdings (This will not display the coin in chart)
        if (!coinData.isTest) {
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

      getAllCoinPriceHistory(timeActiveButton, currentWallet, true, false);
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
    isLoading
  };
};
