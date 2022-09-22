import {
  clientBatch as clientServer,
  IRequestMetadata,
  pricing as pricingServer,
  serverBatch as batchServer
} from '@cypherock/server-wrapper';

import { LatestPriceSyncItem, SyncQueueItem } from '../types';

import {
  ExecutionResult,
  getAllMetadata,
  getAllProcessResponses,
  getClientResponses,
  OptionParams,
  RequestMetaProcessInfo
} from './sync';

export const getBatchRequestsMetadata = (
  items: LatestPriceSyncItem[]
): IRequestMetadata[] => {
  const pricingMetadata = pricingServer
    .getLatest(
      {
        coin: items.map(item => item.id).toString()
      },
      true
    )
    .getMetadata();

  return [pricingMetadata];
};

const getLatestPriceMetadata = (
  items: SyncQueueItem[]
): RequestMetaProcessInfo => {
  const validItems: LatestPriceSyncItem[] = [];

  for (const item of items) {
    try {
      if (item instanceof LatestPriceSyncItem) {
        validItems.push(item);
      } else {
        throw new Error('Invalid sync item');
      }
    } catch (error) {
      return { meta: [], isFailed: true, error, item };
    }
  }
  try {
    const meta = getBatchRequestsMetadata(validItems);
    return { meta, isFailed: false, item: items[0] };
  } catch (error) {
    return { meta: [], isFailed: true, error, item: items[0] };
  }
};

export const executeLatestPriceBatch = async (
  items: LatestPriceSyncItem[],
  options: OptionParams
): Promise<ExecutionResult[]> => {
  if (items.length <= 0) return [];

  const metadata = getLatestPriceMetadata(items);
  const allMetadataInfo = getAllMetadata(items);
  if (allMetadataInfo.length !== items.length) {
    throw new Error(
      'allMetadataInfo length should be equal to items: ' +
        allMetadataInfo.length
    );
  }

  const allResponses: Array<
    batchServer.IBatchResponse | clientServer.IClientResponse
  > = [];

  try {
    const response = await getClientResponses([metadata]);
    for (let i = 0; i < items.length; i++) {
      allResponses.push(response[0]);
    }
  } catch (error) {
    return allMetadataInfo.map(elem => {
      const result: ExecutionResult = {
        item: elem.item,
        isFailed: true,
        canRetry: !elem.isFailed,
        error: elem.error || error
      };
      return result;
    });
  }

  return getAllProcessResponses(allMetadataInfo, allResponses, options);
};
