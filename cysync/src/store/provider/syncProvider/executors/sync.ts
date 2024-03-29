import {
  clientBatch as clientServer,
  IRequestMetadata,
  serverBatch as batchServer
} from '@cypherock/server-wrapper';
import { flatMap } from 'lodash';

import { ExecutionResult } from '../../../hooks';
import {
  BalanceSyncItem,
  CustomAccountSyncItem,
  HistorySyncItem,
  LatestPriceSyncItem,
  PriceSyncItem,
  SyncProviderTypes,
  SyncQueueItem
} from '../types';

import { customAccountExecutor } from '.';
import * as balanceExecutor from './balance';
import * as historyExecutor from './history';
import * as latestPriceExecutor from './latestPrice';
import * as priceExecutor from './pricing';

export interface RequestMetaProcessInfo {
  meta: IRequestMetadata[];
  item: SyncQueueItem;
  error?: Error;
  isFailed: boolean;
}

export interface OptionParams {
  addToQueue: SyncProviderTypes['addToQueue'];
  addPriceSyncItemFromAccount: SyncProviderTypes['addPriceSyncItemFromAccount'];
  addLatestPriceSyncItemFromAccount: SyncProviderTypes['addLatestPriceSyncItemFromAccount'];
  isClientBatch?: boolean;
}

export const getAllMetadata = (items: SyncQueueItem[]) => {
  const allRequestMetadata: RequestMetaProcessInfo[] = [];

  for (const item of items) {
    try {
      let meta: IRequestMetadata[] = [];
      if (item instanceof HistorySyncItem) {
        meta = historyExecutor.getRequestsMetadata(item);
      } else if (item instanceof BalanceSyncItem) {
        meta = balanceExecutor.getRequestsMetadata(item);
      } else if (item instanceof CustomAccountSyncItem) {
        meta = customAccountExecutor.getRequestsMetadata(item);
      } else if (item instanceof PriceSyncItem) {
        meta = priceExecutor.getRequestsMetadata(item);
      } else if (item instanceof LatestPriceSyncItem) {
        meta = latestPriceExecutor.getRequestsMetadata(item);
      } else {
        throw new Error('Invalid sync item');
      }

      allRequestMetadata.push({ meta, isFailed: false, item });
    } catch (error) {
      allRequestMetadata.push({ meta: [], isFailed: true, error, item });
    }
  }

  return allRequestMetadata;
};

const getBatchResponses = async (
  allMetadata: IRequestMetadata[]
): Promise<batchServer.IBatchResponse[]> => {
  if (allMetadata.length <= 0) {
    return Promise.resolve([]);
  }

  return batchServer.create(allMetadata);
};

export const getClientResponses = async (
  allMetadata: IRequestMetadata[]
): Promise<clientServer.IClientResponse[]> => {
  if (allMetadata.length <= 0) {
    return Promise.resolve([]);
  }

  return clientServer.create(allMetadata);
};

export const getAllProcessResponses = async (
  allMetadataInfo: RequestMetaProcessInfo[],
  responses: Array<batchServer.IBatchResponse | clientServer.IClientResponse>,
  options: OptionParams
) => {
  let responseIndex = 0;
  const allExeutionResults: Array<ExecutionResult<SyncQueueItem>> = [];
  for (const meta of allMetadataInfo) {
    if (meta.isFailed) {
      allExeutionResults.push({
        item: meta.item,
        isFailed: true,
        error: meta.error,
        canRetry: false
      });
      continue;
    }

    const { item } = meta;

    let canRetry = false;
    let delay;
    try {
      let processResult: any;
      const resList = responses.slice(
        responseIndex,
        responseIndex + meta.meta.length
      );
      responseIndex += meta.meta.length;

      for (const res of resList) {
        if (res.isFailed) {
          // If the error is anything other than network error, no need to retry
          delay = (res as clientServer.IClientResponse).delay;
          canRetry = true;
          throw new Error(JSON.stringify(res.data));
        }
      }

      if (item instanceof HistorySyncItem) {
        processResult = await historyExecutor.processResponses(
          item,
          resList,
          options
        );
      } else if (item instanceof BalanceSyncItem) {
        processResult = await balanceExecutor.processResponses(item, resList);
      } else if (item instanceof CustomAccountSyncItem) {
        processResult = await customAccountExecutor.processResponses(
          item,
          resList,
          options
        );
      } else if (item instanceof PriceSyncItem) {
        processResult = await priceExecutor.processResponses(item, resList);
      } else if (item instanceof LatestPriceSyncItem) {
        processResult = await latestPriceExecutor.processResponses(
          item,
          resList
        );
      } else {
        canRetry = false;
        throw new Error('Invalid sync item');
      }

      allExeutionResults.push({
        item: meta.item,
        isFailed: false,
        processResult
      });
    } catch (error) {
      allExeutionResults.push({
        item: meta.item,
        isFailed: true,
        error,
        canRetry,
        delay
      });
    }
  }

  return allExeutionResults;
};

export const executeBatch = async (
  items: SyncQueueItem[],
  options: OptionParams
): Promise<Array<ExecutionResult<SyncQueueItem>>> => {
  const BATCH_SIZE = 5;
  if (items.length <= 0) return [];

  const allMetadataInfo = getAllMetadata(items);
  const allMetadata = flatMap(allMetadataInfo.map(elem => elem.meta));
  if (allMetadataInfo.length !== items.length) {
    throw new Error(
      'allMetadataInfo length should be equal to items: ' +
        allMetadataInfo.length
    );
  }

  let allResponses: Array<
    batchServer.IBatchResponse | clientServer.IClientResponse
  > = [];
  try {
    for (let i = 0; i < allMetadata.length; i += BATCH_SIZE) {
      const trimmedMetadata = allMetadata.slice(i, i + BATCH_SIZE);
      if (options.isClientBatch) {
        allResponses = [
          ...allResponses,
          ...(await getClientResponses(trimmedMetadata))
        ];
      } else {
        allResponses = [
          ...allResponses,
          ...(await getBatchResponses(trimmedMetadata))
        ];
      }
    }
  } catch (error) {
    return allMetadataInfo.map(elem => {
      const result: ExecutionResult<SyncQueueItem> = {
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
