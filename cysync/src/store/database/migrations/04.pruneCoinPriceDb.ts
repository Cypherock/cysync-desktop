import logger from '../../../utils/logger';

import { MigrationFunction } from './types';

const pruneCoinPriceDb: MigrationFunction = async params => {
  try {
    const { coinPriceDb } = params;
    const allPrices = await coinPriceDb.getAll();
    const allCoinItems = [...new Set(allPrices.map(el => el.coinId))];

    const newCoinPriceList = [];
    let rebuildRequired = false;
    for (const coinId of allCoinItems) {
      const coinPrices = allPrices
        .filter(el => el.priceLastUpdatedAt && el.coinId === coinId)
        .sort((a, b) => b.priceLastUpdatedAt - a.priceLastUpdatedAt);
      if (coinPrices.length > 1) rebuildRequired = true;
      if (coinPrices.length > 0)
        newCoinPriceList.push({ ...coinPrices[0], _id: `idx-${coinId}` });
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
