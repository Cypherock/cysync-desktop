import {
  batch as batchServer,
  client as clientServer,
  IRequestMetadata
} from '@cypherock/server-wrapper';
import { flatMap } from 'lodash';

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

export interface ExecutionResult {
  item: SyncQueueItem;
  isFailed: boolean;
  canRetry?: boolean;
  error?: Error;
  processResult?: any;
  delay?: number;
}

export interface OptionParams {
  addToQueue: SyncProviderTypes['addToQueue'];
  addPriceSyncItemFromCoin: SyncProviderTypes['addPriceSyncItemFromCoin'];
  addLatestPriceSyncItemFromCoin: SyncProviderTypes['addLatestPriceSyncItemFromCoin'];
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
  allMetadataInfo: RequestMetaProcessInfo[]
): Promise<batchServer.IBatchResponse[]> => {
  const allMetadata = flatMap(allMetadataInfo.map(elem => elem.meta));

  if (allMetadata.length <= 0) {
    return Promise.resolve([]);
  }

  return batchServer.create(allMetadata);
};

export const getClientResponses = async (
  allMetadataInfo: RequestMetaProcessInfo[]
): Promise<clientServer.IClientResponse[]> => {
  const allMetadata = flatMap(allMetadataInfo.map(elem => elem.meta));

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
  const allExeutionResults: ExecutionResult[] = [];
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
): Promise<ExecutionResult[]> => {
  if (items.length <= 0) return [];

  const allMetadataInfo = getAllMetadata(items);
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
    if (options.isClientBatch)
      allResponses = await getClientResponses(allMetadataInfo);
    else allResponses = await getBatchResponses(allMetadataInfo);
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
