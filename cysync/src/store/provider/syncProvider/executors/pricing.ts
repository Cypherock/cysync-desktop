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
  const pricingMetadata = pricingServer
    .get(
      {
        coin: item.id,
        days: item.days
      },
      true
    )
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
    coinId: item.coinId,
    interval: item.days,
    data: res.data.prices
  });

  if (item.days === 30) {
    await priceHistoryDb.insert({
      coinId: item.coinId,
      interval: 7,
      data: res.data.prices.slice(-168) // 7 * 24 for hourly interval
    });
  }
};
