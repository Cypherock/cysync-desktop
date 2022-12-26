import { AbsCoinData, COINS } from '@cypherock/communication';

import logger from '../../../utils/logger';
import { coinPriceDb } from '../databaseInit';

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
