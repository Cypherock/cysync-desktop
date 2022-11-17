import {
  BtcCoinData,
  COINS,
  EthCoinData,
  NearCoinData,
  SolanaCoinData
} from '@cypherock/communication';
import { Status } from '@cypherock/database';
import {
  bitcoin as bitcoinServer,
  eth as ethServer,
  IRequestMetadata,
  near as nearServer,
  serverBatch as batchServer,
  solana as solanaServer
} from '@cypherock/server-wrapper';
import { flatMap } from 'lodash';

import logger from '../../../utils/logger';
import { transactionDb } from '../../database';

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

export const getRequestsMetadata = (
  item: TxnStatusItem
): IRequestMetadata[] => {
  const coin = COINS[item.coinType];

  if (!coin) {
    logger.warn('Invalid coin in sync queue', {
      coinType: item.coinType
    });
    return undefined;
  }

  if (coin instanceof BtcCoinData) {
    const metadata = bitcoinServer.transaction
      .transactionStatus({ coinType: coin.abbr, hash: item.txnHash })
      .getMetadata();
    return [metadata];
  }

  if (coin instanceof EthCoinData) {
    const metadata = ethServer.transaction
      .transactionStatus(
        { network: coin.network, txHash: item.txnHash },
        item.isRefresh
      )
      .getMetadata();
    return [metadata];
  }

  if (coin instanceof NearCoinData) {
    const metadata = nearServer.transaction
      .transactionStatus(
        {
          network: coin.network,
          txHash: item.txnHash,
          sender: item.sender
        },
        item.isRefresh
      )
      .getMetadata();
    return [metadata];
  }

  if (coin instanceof SolanaCoinData) {
    const metadata = solanaServer.transaction
      .transactionStatus(
        { network: coin.network, txHash: item.txnHash },
        item.isRefresh
      )
      .getMetadata();
    return [metadata];
  }

  logger.warn('Invalid coin in sync queue', {
    coinType: item.coinType
  });
  return [];
};

// process the response of one request item based on the coinType
export const processResponses = async (
  item: TxnStatusItem,
  response: batchServer.IBatchResponse
): Promise<any> => {
  const coin = COINS[item.coinType];

  if (!coin) {
    throw new Error('Invalid coin in balance sync item: ' + item.coinType);
  }

  let status;

  if (coin instanceof EthCoinData) {
    if (response.data.result?.status === '1') status = Status.SUCCESS;
    else if (response.data.result?.status === '0') status = Status.FAILURE;
    else status = Status.PENDING; // Pending or not found
  } else if (coin instanceof NearCoinData) {
    // if invalid transaction hash, result: not present and error
    // if success, result.status.successValue; if failure, result.status.Failure; if unprocessed, result.status.Unknown
    if (response.data.error !== undefined)
      throw new Error(`Error from api ${response.data.error}`);
    else if (response.data.result?.status?.Failure !== undefined)
      status = Status.FAILURE;
    else if (response.data.result?.status?.SuccessValue !== undefined)
      status = Status.SUCCESS;
    else status = Status.PENDING;
  } else if (coin instanceof SolanaCoinData) {
    // if invalid transaction or unprocessed hex result is 'null'
    // if result.meta.err is 'null' then success; if failed result.meta.err
    if (response.data.result === null) status = Status.PENDING;
    // invalid or unprocessed txn
    else if (response.data.result?.meta?.err === null) status = Status.SUCCESS;
    else status = Status.FAILURE;
  } else if (coin instanceof BtcCoinData) {
    const confirmations = response.data?.result?.confirmations;
    status = confirmations > 0 ? Status.SUCCESS : Status.PENDING;
  } else {
    throw new Error('Invalid coin type' + item.coinType);
  }

  await transactionDb.findAndUpdate(
    { coin: item.coinType, hash: item.txnHash },
    { status, confirmations: status === Status.SUCCESS ? 1 : 0 }
  );
  await transactionDb.findAndUpdate(
    { slug: item.coinType, hash: item.txnHash },
    { status, confirmations: status === Status.SUCCESS ? 1 : 0 }
  );
  return { isComplete: status !== Status.PENDING };
};

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
