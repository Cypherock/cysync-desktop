import { CoinGroup, COINS } from '@cypherock/communication';
import BigNumber from 'bignumber.js';

import { getPortfolioCache } from '../../../utils/cache';
import logger from '../../../utils/logger';
import {
  accountDb,
  Coin,
  getAllTxns,
  getLatestPriceForCoin,
  priceHistoryDb,
  SentReceive,
  Token,
  tokenDb,
  Transaction
} from '../../database';
import { CoinDetails, CoinHistory, CoinPriceHistory } from '../types';

/**
 * Returns the total price history of a particular coin in a wallet or in all
 * wallets
 */
export const getCoinPriceHistory = async (
  coinType: string,
  days: number,
  walletId = '',
  parent?: string
) => {
  let coinData;
  if (parent) {
    const parentData = COINS[parent];
    if (!parentData) throw new Error(`Parent coin ${parent} not found`);
    coinData = parentData.tokenList[coinType];
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

  if (walletId && walletId !== 'null') {
    if (coinData.group === CoinGroup.ERC20Tokens) {
      const token = await tokenDb.getOne({
        walletId,
        slug: coinType
      });
      if (token) totalBalance = new BigNumber(token.balance);
      else return null;
    } else {
      const coin = await accountDb.getOne({ walletId, slug: coinType });
      if (coin)
        totalBalance = new BigNumber(coin.totalBalance ? coin.totalBalance : 0);
      else return null;
    }

    transactionHistory = await getAllTxns(
      {
        walletId,
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
      const allCoins = await accountDb.getAll({ slug: coinType });
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
    pIndex > 0;
    pIndex--
  ) {
    const isFirst = pIndex === latestUnitPrices.length - 1;
    const transaction = transactionHistory[tIndex];
    let isTxnAdded = false;
    if (transaction?.confirmed) {
      const transactionTime = new Date(transaction.confirmed).getTime();
      const prevPricePoint = computedPrices[pIndex - 1][0];
      const thisPricePoint = computedPrices[pIndex][0];

      if (
        (prevPricePoint < transactionTime &&
          transactionTime <= thisPricePoint) ||
        (isFirst && transactionTime >= thisPricePoint)
      ) {
        if (transaction.sentReceive === SentReceive.SENT) {
          curBalance = curBalance.plus(new BigNumber(transaction.amount));
          if (coinData.group !== CoinGroup.ERC20Tokens) {
            curBalance = curBalance.plus(new BigNumber(transaction.fees));
          }
        } else if (transaction.sentReceive === SentReceive.FEES) {
          curBalance = curBalance.plus(new BigNumber(transaction.amount));
        } else {
          curBalance = curBalance.minus(new BigNumber(transaction.amount));
        }
        tIndex--;
        isTxnAdded = true;
      }
    }
    computedPrices[pIndex][1] = curBalance
      .multipliedBy(latestUnitPrices[pIndex][1])
      .dividedBy(coinData.multiplier)
      .toNumber();

    if (isTxnAdded) {
      pIndex++;
    }
  }

  computedPrices[0][1] = curBalance
    .multipliedBy(computedPrices[0][1])
    .dividedBy(coinData.multiplier)
    .toNumber();

  let hasNegative = false;
  for (const price of computedPrices) {
    if (price && price[1] && price[1] < 0) {
      price[1] = 0;
      hasNegative = true;
    }
  }

  if (hasNegative) {
    logger.warn('Portfolio: Negative value found in ' + coinType, {
      coinType,
      parent,
      hasWallet: !!walletId,
      days
    });
  }

  return {
    totalBalance,
    unitPrices: latestUnitPrices,
    pricesToDisplay: computedPrices
  } as CoinPriceHistory;
};

/**
 * Returns the total price history of all coins in a wallet or in all wallets
 */
const getAllCoinPriceHistory = async (params: {
  days: number;
  walletId?: string;
  isRefresh?: boolean;
  allCoins: Coin[];
  allTokens: Token[];
  allCoinItems: Array<{ parent?: string; slug: string }>;
}) => {
  const { days, walletId, isRefresh, allCoinItems } = params;

  const key = `${walletId}-${days}`;
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
      return {
        oldTotalPrice: cacheData.prevTotal,
        coinList: cacheData.allCoinList,
        coinHistory: cacheData.allCoinPriceHistory
      };
    }
  }

  logger.info('Computing graph data');

  const allCoinPriceHistory: CoinHistory[] = [];
  const allCoinList: string[] = ['All Coins'];
  let prevTotal = new BigNumber(0);

  for (const item of allCoinItems) {
    let coin;
    if (item.parent) {
      const parent = COINS[item.parent];
      coin = parent.tokenList[item.slug];
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
      walletId,
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
        walletId
      });
      continue;
    }

    prevTotal = prevTotal.plus(coinPrices.pricesToDisplay[0][1]);
  }

  return {
    oldTotalPrice: prevTotal.toNumber(),
    coinList: allCoinList,
    coinHistory: allCoinPriceHistory
  };
};

export const coinsUserHas = async (params: {
  walletId?: string;
  allCoins: Coin[];
  allTokens: Token[];
  allCoinItems: Array<{ parent?: string; slug: string }>;
}) => {
  const { walletId, allCoinItems } = params;

  let totalAmount = new BigNumber(0);
  const allCoinholding: number[] = [];
  const setOfCoins: CoinDetails[] = [];

  for (const item of allCoinItems) {
    let coinData;
    if (item.parent) {
      const parent = COINS[item.parent];
      if (!parent) {
        throw new Error(`Cannot find parent coinType: ${item.parent}`);
      }
      coinData = parent.tokenList[item.slug];
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
        const xpub = await accountDb.getOne({ walletId, slug: item.slug });
        if (xpub)
          totalBalance = new BigNumber(
            xpub.totalBalance ? xpub.totalBalance : 0
          );
        else continue;
      }
    } else {
      if (coinData.group === CoinGroup.ERC20Tokens) {
        const tokens = await tokenDb.getAll({ slug: item.slug });
        if (tokens.length === 0) continue;
        for (const token of tokens) {
          totalBalance = totalBalance.plus(token.balance);
        }
      } else {
        const coinsData = await accountDb.getAll({ slug: item.slug });
        if (coinsData.length === 0) continue;
        for (const coin of coinsData) {
          totalBalance = totalBalance.plus(
            coin.totalBalance ? coin.totalBalance : 0
          );
        }
      }
    }

    const latestPrice = await getLatestPriceForCoin(item.slug, item.parent);

    const balance = totalBalance.dividedBy(coinData.multiplier);

    currentTempCoin.balance = balance.toString();

    const value = balance.multipliedBy(latestPrice).toNumber();

    currentTempCoin.value = value.toString();

    currentTempCoin.price = latestPrice.toString();

    // Don't add coins to holdings (This will not display the coin in chart)
    if (!coinData.isTest) {
      const val = parseFloat(value.toFixed(3));
      allCoinholding.push(val);
    }

    setOfCoins.push(currentTempCoin);
    totalAmount = totalAmount.plus(currentTempCoin.value || 0);
  }

  return {
    allCoinholding,
    setOfCoins: setOfCoins.sort((a, b) =>
      new BigNumber(b.value).minus(a.value).toNumber()
    ),
    totalAmount: totalAmount.toNumber()
  };
};

export const getCoinData = async (params: {
  days: number;
  walletId?: string;
  isRefresh?: boolean;
  onlyGraphChange?: boolean;
}) => {
  const { days, walletId, isRefresh } = params;
  const allCoins = await accountDb.getAll();
  const allTokens = await tokenDb.getAll();
  const allCoinItems = [
    ...new Map(
      allCoins
        .map(coin => {
          return { parent: undefined, slug: coin.slug };
        })
        .map(item => [JSON.stringify(item), item])
    ).values(),
    ...new Map(
      allTokens
        .map(token => {
          return { parent: token.coin, slug: token.slug };
        })
        .map(item => [JSON.stringify(item), item])
    ).values()
  ];

  let data1: {
    allCoinholding?: number[];
    setOfCoins?: CoinDetails[];
    totalAmount?: number;
  } = {};

  if (!params.onlyGraphChange) {
    data1 = await coinsUserHas({
      walletId,
      allCoins,
      allTokens,
      allCoinItems
    });
  }

  const data2 = await getAllCoinPriceHistory({
    days,
    walletId,
    isRefresh,
    allCoins,
    allTokens,
    allCoinItems
  });

  return {
    ...data1,
    ...data2,
    hasCoins: allCoinItems.length > 0
  };
};
