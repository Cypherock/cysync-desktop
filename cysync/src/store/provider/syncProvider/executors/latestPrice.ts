import { CoinGroup } from '@cypherock/communication';
import {
  batch as batchServer,
  IRequestMetadata,
  pricing as pricingServer
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
  if (usesNewApi) {
    data = res.data?.get(item.id)?.get('usd');
  } else {
    data = res.data.data.price;
  }

  if (item.coinGroup === CoinGroup.ERC20Tokens)
    await tokenDb.findAndUpdate({ slug: item.coinType }, { price: data });
  else await coinDb.findAndUpdate({ slug: item.coinType }, { price: data });
};
