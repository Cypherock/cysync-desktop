import { CoinGroup } from '@cypherock/communication';
import {
  IRequestMetadata,
  pricing as pricingServer,
  serverBatch as batchServer
} from '@cypherock/server-wrapper';

import { coinDb, tokenDb } from '../../../database';
import { LatestPriceSyncItem } from '../types';

export const getRequestsMetadata = (
  item: LatestPriceSyncItem
): IRequestMetadata[] => {
  const usesNewApi = Boolean(item.id);
  const pricingMetadata = pricingServer
    .getLatest(
      {
        coin: usesNewApi ? item.id : item.coinType
      },
      usesNewApi
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

  const usesNewApi = Boolean(item.id);
  let data;
  let priceLastUpdatedAt;
  if (usesNewApi) {
    data = res.data[item.id].usd;
    priceLastUpdatedAt = res.data[item.id].last_updated_at;
  } else {
    data = res.data.data.price;
  }

  if (item.coinGroup === CoinGroup.ERC20Tokens)
    await tokenDb.findAndUpdate(
      { slug: item.coinType },
      { price: data, priceLastUpdatedAt }
    );
  else
    await coinDb.findAndUpdate(
      { slug: item.coinType },
      { price: data, priceLastUpdatedAt }
    );
};
