import { CoinGroup, COINS } from '@cypherock/communication';
import BigNumber from 'bignumber.js';

import logger from '../../../utils/logger';
import { Coin, coinDb, tokenDb } from '../databaseInit';

export interface DisplayCoin extends Coin {
  displayValue: string;
  displayPrice: string;
  displayBalance: string;
  isEmpty: boolean;
}

export const getLatestPriceForCoin = async (
  coin: string,
  parentCoin?: string
) => {
  let coinData: any = COINS[coin];
  if (parentCoin && parentCoin !== coin) {
    const parentCoinData = COINS[parentCoin];
    if (!parentCoinData) {
      throw new Error('Invalid parentCoin: ' + parentCoin);
    }

    const token = parentCoinData.tokenList[coin];
    if (!token) {
      throw new Error(
        'Invalid token: ' + coin + ' in parentCoin: ' + parentCoin
      );
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
  return res.price || 0;
};

export const getLatestPriceForCoins = async (
  coins: Array<{ slug: string; parent?: string }>
) => {
  const latestPrices: Record<string, number | undefined> = {};
  for (const coin of coins) {
    latestPrices[coin.slug.toLowerCase()] = await getLatestPriceForCoin(
      coin.slug,
      coin.parent
    );
  }
  return latestPrices;
};

export const getCoinWithPrices = async (coin: Coin) => {
  const coinObj = COINS[coin.slug];
  if (!coinObj) {
    throw new Error(`Cannot find coinType: ${coin.slug}`);
  }

  const coinWithPrice: DisplayCoin = {
    ...coin,
    isEmpty: true,
    displayValue: '0',
    displayPrice: '0',
    displayBalance: '0'
  };
  const balance = new BigNumber(
    coin.totalBalance ? coin.totalBalance : 0
  ).dividedBy(coinObj.multiplier);

  coinWithPrice.displayBalance = balance.toString();

  const latestPrice = coin.price || 0;
  const value = balance.multipliedBy(latestPrice || 0);
  coinWithPrice.displayValue = value.toString();
  coinWithPrice.displayPrice = latestPrice.toString() || '0';
  coinWithPrice.isEmpty = balance.isZero();

  return coinWithPrice;
};
