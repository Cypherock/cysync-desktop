import { ALLCOINS } from '@cypherock/communication';

import logger from '../../utils/logger';

import { Databases, dbUtil } from './databaseInit';

export const getLatestPriceForCoin = async (coin: string) => {
  if (ALLCOINS[coin] && ALLCOINS[coin].isTest) return 0;

  return dbUtil(Databases.LATESTPRICE, 'getPrice', coin.toLowerCase()).then(
    res => {
      if (res) {
        return res.price;
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
