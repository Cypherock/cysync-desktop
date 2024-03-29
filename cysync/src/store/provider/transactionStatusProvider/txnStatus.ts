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

import logger from '../../../utils/logger';
import { transactionDb } from '../../database';
import { SyncQueueItem } from '../syncProvider/types';

import { TxnStatusItem } from './txnStatusItem';

export const getCurrentTxnStatus = async (
  item: TxnStatusItem
): Promise<Status> => {
  let oldStatus;
  try {
    oldStatus = (
      await transactionDb.getOne({
        accountId: item.accountId,
        hash: item.txnHash
      })
    )?.status;
  } catch (e) {
    logger.error('Cannot fetch transaction from DB', e, item);
  }
  return oldStatus;
};

export const getRequestsMetadata = (
  item: SyncQueueItem
): IRequestMetadata[] => {
  const coinId =
    item.parentCoinId && item.parentCoinId !== item.coinId
      ? item.parentCoinId
      : item.coinId;
  const coin = COINS[coinId];

  if (!coin || !(item instanceof TxnStatusItem)) {
    logger.warn('Invalid item in transaction status sync queue', item);
    throw new Error('Invalid item in transaction sync queue');
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
    coinId
  });
  return [];
};

// process the response of one request item based on the coinType
export const processResponses = async (
  item: TxnStatusItem,
  response: batchServer.IBatchResponse
): Promise<any> => {
  const coinId =
    item.parentCoinId && item.parentCoinId !== item.coinId
      ? item.parentCoinId
      : item.coinId;
  const coin = COINS[coinId];

  if (!coin) {
    throw new Error('Invalid coin in transaction status sync item: ' + coinId);
  }

  let status;
  let confirmations;
  const currentStatus = await getCurrentTxnStatus(item);

  if (coin instanceof EthCoinData) {
    if (response.data.result?.status === '1') status = Status.SUCCESS;
    else if (response.data.result?.status === '0') status = Status.FAILURE;
    else status = Status.PENDING; // Pending or not found
  } else if (coin instanceof NearCoinData) {
    // if invalid transaction hash, result: not present and error
    // response.data.error !== undefined; internal API will catch this and set NOT_OK response code

    // if success, result.status.successValue; if failure, result.status.Failure; if unprocessed, result.status.Unknown
    if (response.data.result?.status?.Failure !== undefined)
      status = Status.FAILURE;
    else if (response.data.result?.status?.SuccessValue !== undefined)
      status = Status.SUCCESS;
    else status = Status.PENDING;
  } else if (coin instanceof SolanaCoinData) {
    // if invalid transaction or unprocessed hex result is 'null'
    // if result.meta.err is 'null' then success; if failed result.meta.err is not null
    if (response.data.result === null) status = Status.PENDING;
    // invalid or unprocessed txn
    else if (response.data.result?.meta?.err === null) status = Status.SUCCESS;
    else status = Status.FAILURE;
  } else if (coin instanceof BtcCoinData) {
    confirmations = response.data?.result?.confirmations;
    status = confirmations > 0 ? Status.SUCCESS : Status.PENDING;
  } else {
    throw new Error('Invalid coin type' + coinId);
  }

  // status already updated; no db update needed
  if (currentStatus !== Status.PENDING) return { isComplete: true };

  // potential overwrite of resynced transactions
  await transactionDb.findAndUpdate(
    { accountId: item.accountId, hash: item.txnHash },
    {
      status,
      confirmations: status === Status.SUCCESS ? confirmations || 1 : 0
    }
  );
  return { isComplete: status !== Status.PENDING };
};
