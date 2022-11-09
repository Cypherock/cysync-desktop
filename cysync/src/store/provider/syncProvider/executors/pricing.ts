import {
  IRequestMetadata,
  pricing as pricingServer,
  serverBatch as batchServer
} from '@cypherock/server-wrapper';

import { priceHistoryDb } from '../../../database';
import { PriceSyncItem } from '../types';

export const getRequestsMetadata = (
  item: PriceSyncItem
): IRequestMetadata[] => {
  const usesNewApi = Boolean(item.id);
  const pricingMetadata = pricingServer
    .get(
      {
        coin: usesNewApi ? item.id : item.coinType,
        days: item.days
      },
      usesNewApi
    )
    .getMetadata();

  return [pricingMetadata];
};

export const processResponses = async (
  item: PriceSyncItem,
  responses: batchServer.IBatchResponse[]
): Promise<any> => {
  const usesNewApi = Boolean(item.id);
  if (responses.length <= 0) {
    throw new Error('Did not find responses while processing');
  }

  const res = responses[0];

  await priceHistoryDb.insert({
    slug: item.coinType,
    interval: item.days,
    data: usesNewApi ? res.data.prices : res.data.data.entries
  });

  if (item.days === 30 && usesNewApi) {
    await priceHistoryDb.insert({
      slug: item.coinType,
      interval: 7,
      data: res.data.prices.slice(-168) // 7 * 24 for hourly interval
    });
  }
};
