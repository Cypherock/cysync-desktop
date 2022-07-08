import { CoinGroup, COINS, EthCoinData } from '@cypherock/communication';

import logger from '../../../utils/logger';
import { coinDb, tokenDb } from '../databaseInit';

export const getLatestPriceForCoin = async (
  coin: string,
  parentCoin?: string
) => {
  let coinData: any = COINS[coin];
  if (parentCoin) {
    const parentCoinData = COINS[parentCoin];
    if (!parentCoinData || !(parentCoinData instanceof EthCoinData)) {
      throw new Error('Invalid parentCoin: ' + parentCoin);
    }

    const token = parentCoinData.erc20TokensList[coin];
    if (!token) {
      throw new Error('Invalid token: ' + coin);
    }
    coinData = token;
  }
  if (!coinData) throw new Error('Invalid coin: ' + coin);
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

export const getLatestPriceForCoins = async (
  coins: Array<[string, string]>
) => {
  const latestPrices: Record<string, number | undefined> = {};
  for (const coin of coins) {
    latestPrices[coin[0].toLowerCase()] = await getLatestPriceForCoin(
      coin[0],
      coin[1]
    );
  }
  return latestPrices;
};
