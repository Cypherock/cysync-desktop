import logger from '../../../utils/logger';

import { MigrationFunction } from './types';

const pruneCoinPriceDb: MigrationFunction = async params => {
  try {
    const { accountDb, coinPriceDb, tokenDb } = params;
    const allPrices = await coinPriceDb.getAll();
    const allAccounts = await accountDb.getAll();
    const allTokens = await tokenDb.getAll();
    const allCoinItems = [
      ...new Map(
        allAccounts
          .map(coin => {
            return coin.coinId;
          })
          .map(item => [JSON.stringify(item), item])
      ).values(),
      ...new Map(
        allTokens
          .map(token => {
            return token.coinId;
          })
          .map(item => [JSON.stringify(item), item])
      ).values()
    ];

    const newCoinPriceList = [];
    let rebuildRequired = false;
    for (const coinId of allCoinItems) {
      const coinPrices = allPrices
        .filter(el => el.coinId === coinId)
        .sort((a, b) => b.priceLastUpdatedAt - a.priceLastUpdatedAt);
      if (coinPrices.length > 1) rebuildRequired = true;
      if (coinPrices.length > 0) newCoinPriceList.push(coinPrices[0]);
    }

    if (rebuildRequired) {
      await coinPriceDb.delete({ databaseVersion: 'v1' });
      await coinPriceDb.insertMany(newCoinPriceList);
    }
  } catch (error) {
    logger.error('Error in pruning coin price database.');
    logger.error(error);
  }
};

export default pruneCoinPriceDb;
