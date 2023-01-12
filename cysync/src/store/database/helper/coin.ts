import { AbsCoinData, COINS } from '@cypherock/communication';
import BigNumber from 'bignumber.js';

import logger from '../../../utils/logger';
import { Account, coinPriceDb } from '../databaseInit';

export interface DisplayCoin extends Account {
  displayValue: string;
  displayPrice: string;
  displayBalance: string;
  isEmpty: boolean;
  price: number;
  priceLastUpdatedAt?: Date;
}

export const getLatestPriceForCoin = async (
  coinId: string,
  parentCoinId?: string
) => {
  let coinData: AbsCoinData = COINS[coinId];
  if (parentCoinId && parentCoinId !== coinId) {
    const parentCoinData = COINS[parentCoinId];
    if (!parentCoinData) {
      throw new Error('Invalid parentCoin: ' + parentCoinId);
    }

    const token = parentCoinData.tokenList[coinId];
    if (!token) {
      throw new Error(
        'Invalid token: ' + coinId + ' in parentCoin: ' + parentCoinId
      );
    }
    coinData = token;
  }

  if (!coinData) throw new Error('Invalid coin: ' + coinId);
  if (coinData && coinData.isTest) return 0;

  const res = await coinPriceDb.getOne({ coinId: coinData.id });

  if (!res) {
    logger.warn(`Cannot find price for coin ${coinId}`);
    return 0;
  }
  return res.price || 0;
};

export const getLatestPriceForCoins = async (
  coins: Array<{ coinId: string; parentCoinId?: string }>
) => {
  const latestPrices: Record<string, number | undefined> = {};
  for (const coin of coins) {
    latestPrices[coin.coinId] = await getLatestPriceForCoin(
      coin.coinId,
      coin.parentCoinId
    );
  }
  return latestPrices;
};

export const getCoinWithPrices = async (account: Account) => {
  const coinObj = COINS[account.coinId];
  if (!coinObj) {
    throw new Error(`Cannot find coinType: ${account.coinId}`);
  }
  const coinPrice = await coinPriceDb.getOne({ coinId: account.coinId });

  const coinWithPrice: DisplayCoin = {
    ...account,
    isEmpty: true,
    displayValue: '0',
    displayPrice: '0',
    displayBalance: '0',
    price: coinPrice.price
  };
  const balance = new BigNumber(
    account.totalBalance ? account.totalBalance : 0
  ).dividedBy(coinObj.multiplier);

  coinWithPrice.displayBalance = balance.toString();

  const latestPrice = coinPrice?.price || 0;
  const value = balance.multipliedBy(latestPrice || 0);
  coinWithPrice.displayValue = value.toString();
  coinWithPrice.displayPrice = latestPrice.toString() || '0';
  coinWithPrice.isEmpty = balance.isZero();

  return coinWithPrice;
};
