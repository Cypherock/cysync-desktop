import {
  batch as batchServer,
  IRequestMetadata,
  pricing as pricingServer
} from '@cypherock/server-wrapper';

import { coinDb, tokenDb } from '../../../database';
import { LatestPriceSyncItem } from '../types';
import { ERC20TOKENS } from '@cypherock/communication';

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
  console.log('latestPrice', res, item, ERC20TOKENS[item.coinType.toLowerCase()]);

  if (ERC20TOKENS[item.coinType.toLowerCase()])
    await tokenDb.findAndUpdate(
      { slug: item.coinType },
      { price: res.data.data.price }
    );
  else
    await coinDb.findAndUpdate(
      { slug: item.coinType },
      { price: res.data.data.price }
    );
};
