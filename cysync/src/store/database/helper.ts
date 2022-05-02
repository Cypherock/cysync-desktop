import { ALLCOINS } from '@cypherock/communication';
import ILatestPrice from '@cypherock/database/dist/models/latestPrice';
import { pricing as pricingServer } from '@cypherock/server-wrapper';

import logger from '../../utils/logger';

import { latestPriceDb } from './databaseInit';

export const getLatestPriceForCoin = async (coin: string) => {
  if (ALLCOINS[coin] && ALLCOINS[coin].isTest) return 0;

  return latestPriceDb
    .getPrice(coin.toLowerCase())
    .then(async (res: ILatestPrice) => {
      if (res) {
        return res.price;
      }
      logger.warn(`Couldn't find price for coin ${coin}, trying to fetch it`);
      const response = await pricingServer.getLatest({
        coin: coin.toLowerCase()
      });
      if (response) {
        logger.info(`Successfully fetched price for coin ${coin}`);
        const latestPrice = response.data.data.price;
        await latestPriceDb.insert(coin.toLowerCase(), latestPrice);
        return latestPrice;
      }
      logger.error(`Cannot fetch ${coin} latest price`);
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
