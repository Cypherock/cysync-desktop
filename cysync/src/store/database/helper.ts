import { ALLCOINS } from '@cypherock/communication';
import ILatestPrice from '@cypherock/database/dist/models/latestPrice';

import logger from '../../utils/logger';

import { latestPriceDb } from './databaseInit';

export const getLatestPriceForCoin = async (coin: string) => {
  if (ALLCOINS[coin] && ALLCOINS[coin].isTest) return 0;

  return latestPriceDb
    .getPrice(coin.toLowerCase())
    .then((res: ILatestPrice) => {
      if (res) {
        return res.price;
      }
      logger.warn(`Cannot find price for coin ${coin}`);
      return 0;
    });
};

export const getLatestPriceForCoins = async (coins: string[]) => {
  const latestPrices: Record<string, number | undefined> = {};
  for (const coin of coins) {
    latestPrices[coin.toLowerCase()] = await getLatestPriceForCoin(coin);
  }
  return latestPrices;
};
