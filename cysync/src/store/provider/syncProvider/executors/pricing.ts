import {
  batch as batchServer,
  IRequestMetadata,
  pricing as pricingServer
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
};
