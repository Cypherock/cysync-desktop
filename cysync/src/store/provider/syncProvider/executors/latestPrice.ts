import {
  IRequestMetadata,
  pricing as pricingServer,
  serverBatch as batchServer
} from '@cypherock/server-wrapper';

import { coinPriceDb } from '../../../database';
import { LatestPriceSyncItem } from '../types';

export const getRequestsMetadata = (
  item: LatestPriceSyncItem
): IRequestMetadata[] => {
  const pricingMetadata = pricingServer
    .getLatest(
      {
        coin: item.id
      },
      true
    )
    .getMetadata();

  return [pricingMetadata];
};

export const processResponses = async (
  item: LatestPriceSyncItem,
  responses: batchServer.IBatchResponse[]
): Promise<any> => {
  if (responses.length <= 0) {
    throw new Error('Did not find responses while processing');
  }

  const res = responses[0];

  const data = res.data[item.id].usd;
  const priceLastUpdatedAt =
    res.data[item.id].last_updated_at ?? Math.floor(Date.now() / 1000);

  await coinPriceDb.insert({
    coinId: item.coinId,
    price: data,
    priceLastUpdatedAt
  });
};
