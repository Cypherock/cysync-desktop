import { ALLCOINS, CoinGroup } from '@cypherock/communication';

import logger from '../../../utils/logger';
import { coinDb, tokenDb } from '../databaseInit';

export const getLatestPriceForCoin = async (coin: string) => {
  const coinData = ALLCOINS[coin];
  if (coinData && coinData.isTest) return 0;

  let res;
  if (coinData.group === CoinGroup.ERC20Tokens)
    res = await tokenDb.getOne({ slug: coin });
  else res = await coinDb.getOne({ slug: coin });

  if (!res) {
    logger.warn(`Cannot find price for coin ${coin}`);
    return 0;
  }
  return res.price;
};

export const getLatestPriceForCoins = async (coins: string[]) => {
  const latestPrices: Record<string, number | undefined> = {};
  for (const coin of coins) {
    latestPrices[coin.toLowerCase()] = await getLatestPriceForCoin(coin);
  }
  return latestPrices;
};
