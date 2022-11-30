import { IRequestMetadata } from '@cypherock/server-wrapper';
import { serverBatch as batchServer } from '@cypherock/server-wrapper/dist/resources';
import { flatMap } from 'lodash';

import logger from '../../../utils/logger';

import { getRequestsMetadata, processResponses } from './txnStatus';
import { TxnStatusItem } from './txnStatusItem';

export interface RequestMetaProcessInfo {
  meta: IRequestMetadata[];
  item: TxnStatusItem;
  error?: Error;
  isFailed: boolean;
}

export interface ExecutionResult {
  item: TxnStatusItem;
  isFailed: boolean;
  isComplete?: boolean;
  canRetry?: boolean;
  error?: Error;
  processResult?: any;
  delay?: number;
}

// Populates the metadata for each entry of batch query
export const getAllMetadata = (items: TxnStatusItem[]) => {
  const allRequestMetadata: RequestMetaProcessInfo[] = [];

  items.forEach(item => {
    try {
      const meta = getRequestsMetadata(item);
      allRequestMetadata.push({ meta, isFailed: false, item });
    } catch (error) {
      allRequestMetadata.push({ meta: [], isFailed: true, error, item });
    }
  });

  return allRequestMetadata;
};

// queries the server for batched request
const getBatchResponses = async (
  allMetadataInfo: RequestMetaProcessInfo[]
): Promise<batchServer.IBatchResponse[]> => {
  const allMetadata = flatMap(allMetadataInfo.map(elem => elem.meta));

  if (allMetadata.length <= 0) {
    return Promise.resolve([]);
  }

  return batchServer.create(allMetadata);
};

export const getAllProcessResponses = async (
  allMetadataInfo: RequestMetaProcessInfo[],
  responses: batchServer.IBatchResponse[]
) => {
  let responseIndex = 0;
  const allExeutionResults: ExecutionResult[] = [];

  for (const meta of allMetadataInfo) {
    if (meta.isFailed) {
      allExeutionResults.push({
        item: meta.item,
        isFailed: true,
        isComplete: false,
        error: meta.error,
        canRetry: false
      });
      continue;
    }

    const { item } = meta;

    let canRetry = false;
    const delay = 0;
    try {
      let processResult: any;
      const res = responses.at(responseIndex++);

      if (res.isFailed) {
        // server errors
        canRetry = true;
        throw new Error(JSON.stringify(res.data));
      }

      if (item instanceof TxnStatusItem) {
        processResult = await processResponses(item, res);
      } else {
        canRetry = false;
        throw new Error('Invalid sync item');
      }

      allExeutionResults.push({
        ...processResult,
        item: meta.item,
        isFailed: false
      });
    } catch (error) {
      logger.info('execution catch error' + error.toString());
      allExeutionResults.push({
        item: meta.item,
        isFailed: true,
        isComplete: false,
        error,
        canRetry,
        delay
      });
    }
  }

  return allExeutionResults;
};

export const executeBatchCheck = async (
  items: TxnStatusItem[]
): Promise<ExecutionResult[]> => {
  if (items.length <= 0) return [];

  const allMetadataInfo = getAllMetadata(items);
  if (allMetadataInfo.length !== items.length) {
    throw new Error(
      'allMetadataInfo length should be equal to items: ' +
        allMetadataInfo.length
    );
  }

  let allResponses: batchServer.IBatchResponse[] = [];
  allResponses = await getBatchResponses(allMetadataInfo);

  return getAllProcessResponses(allMetadataInfo, allResponses);
};
