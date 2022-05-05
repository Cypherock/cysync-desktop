import {
  batch as batchServer,
  IRequestMetadata,
  pricing as pricingServer
} from '@cypherock/server-wrapper';

import { latestPriceDb } from '../../../database';
import { LatestPriceSyncItem } from '../types';

export const getRequestsMetadata = (
  item: LatestPriceSyncItem
): IRequestMetadata[] => {
  const pricingMetadata = pricingServer
    .getLatest({
      coin: item.coinType
    })
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

  await latestPriceDb.insert(item.coinType, res.data.data.price);
};
