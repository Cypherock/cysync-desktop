import { ALLCOINS } from '@cypherock/communication';
import ILatestPrice from '@cypherock/database/dist/models/latestPrice';

import logger from '../../utils/logger';

import { Databases, dbUtil } from './databaseInit';

export const getLatestPriceForCoin = async (coin: string) => {
  if (ALLCOINS[coin] && ALLCOINS[coin].isTest) return 0;

  return dbUtil(Databases.PRICE, 'getPrice', coin.toLowerCase(), 7).then(
    res => {
      if (res) {
        const { length } = res.data;
        return res.data[length - 1][1];
      }
      logger.warn(`Cannot find price for coin ${coin}`);
      return 0;
    }
  );
};

export const getLatestPriceForCoins = async (coins: string[]) => {
  const latestPrices: Record<string, number | undefined> = {};
  for (const coin of coins) {
    latestPrices[coin.toLowerCase()] = await getLatestPriceForCoin(coin);
  }
  return latestPrices;
};
