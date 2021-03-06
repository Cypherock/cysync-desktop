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
  const pricingMetadata = pricingServer
    .get({
      coin: item.coinType,
      days: item.days
    })
    .getMetadata();

  return [pricingMetadata];
};

export const processResponses = async (
  item: PriceSyncItem,
  responses: batchServer.IBatchResponse[]
): Promise<any> => {
  if (responses.length <= 0) {
    throw new Error('Did not find responses while processing');
  }

  const res = responses[0];

  await priceHistoryDb.insert({
    slug: item.coinType,
    interval: item.days,
    data: res.data.data.entries
  });
};
