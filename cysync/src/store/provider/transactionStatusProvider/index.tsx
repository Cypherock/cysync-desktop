import { COINS } from '@cypherock/communication';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import logger from '../../../utils/logger';
import { accountDb, Status, Transaction, transactionDb } from '../../database';
import { ExecutionResult } from '../../hooks';
import { useExecutionQueue } from '../../hooks/useExecutionQueue';
import { RESYNC_INTERVAL, useSync } from '../syncProvider';

import { executeBatchCheck } from './sync';
import { TxnStatusItem } from './txnStatusItem';

export interface TransactionStatusProviderInterface {
  addTransactionStatusCheckItem: (
    txn: Transaction,
    options?: { isRefresh?: boolean }
  ) => void;
}

export const StatusCheckContext: React.Context<TransactionStatusProviderInterface> =
  React.createContext<TransactionStatusProviderInterface>(
    {} as TransactionStatusProviderInterface
  );

export const TransactionStatusProvider: React.FC = ({ children }) => {
  const BATCH_SIZE = 5;

  // pick, batch and execute the queued request items
  const queueExecutor = async () => {
    let items: TxnStatusItem[] = [];

    if (queue.length > 0) {
      // deduct the backoff time
      // this is inaccurate; actual backoff is (backoff + queue processing)
      queue.forEach(ele => {
        if (!(ele instanceof TxnStatusItem)) return;
        ele.backoffTime = Math.max(0, ele.backoffTime - queueExecuteInterval);
      });

      // filter items ready for execution i.e. backoffTime is 0
      items = queue.filter(
        ele =>
          ele instanceof TxnStatusItem &&
          ele.backoffTime <= queueExecuteInterval
      );
    }

    try {
      if (connected && queue.length > 0 && items.length > 0) {
        return await Promise.all([
          executeBatchCheck(items.slice(0, BATCH_SIZE))
        ]);
      }
    } catch (e) {
      // Only handling MetadataInfo length mismatch
      logger.error('Failure in batch execution', e);
    }
    return Promise.all([]);
  };

  // finally update the queue after one execution cycle
  const updateAllExecutedItems = async (
    executionResults: Array<ExecutionResult<TxnStatusItem>>
  ) => {
    const allCompletedModulesSet: Set<string> = new Set<string>();
    const syncQueueUpdateOperations: Array<{
      item: TxnStatusItem;
      operation: 'remove' | 'update';
      updatedItem?: TxnStatusItem;
    }> = [];

    for (const result of executionResults) {
      const { item } = result;
      let updatedItem;
      let removeFromQueue = true;

      if (result.isFailed || !result.isComplete) {
        updatedItem = item.clone();
        removeFromQueue = false;
        updatedItem.backoffFactor *= backoffExpMultiplier;
        updatedItem.backoffTime =
          updatedItem.backoffFactor * backoffBaseInterval;

        // not very precise; next history sync might be very near in time
        // ineffective in reducing API calls, helpful to shorten the syncQueue
        if (updatedItem.backoffTime > RESYNC_INTERVAL) removeFromQueue = true;
      }

      syncQueueUpdateOperations.push({
        operation: removeFromQueue ? 'remove' : 'update',
        item,
        updatedItem
      });
      if (removeFromQueue) allCompletedModulesSet.add(item.module);

      // no need for resync as transaction is incomplete; skipping it
      if (result.isComplete !== true) continue;

      try {
        // status is final, resync balances and history
        const coinEntry = await accountDb.getOne({
          accountId: item.accountId
        });
        addBalanceSyncItemFromCoin(
          {
            ...coinEntry,
            coinGroup: item.coinGroup,
            parentCoinId: item.parentCoinId
          },
          {}
        );
        addHistorySyncItemFromCoin(
          {
            ...coinEntry,
            coinGroup: item.coinGroup,
            parentCoinId: item.parentCoinId
          },
          {}
        );
      } catch (e) {
        logger.error('Failed to sync after transaction status update', e, item);
      }
    }
    updateQueueItems(syncQueueUpdateOperations, allCompletedModulesSet);
  };

  const { addBalanceSyncItemFromCoin, addHistorySyncItemFromCoin } = useSync();
  const {
    connected,
    queue,
    setInitialSetupDone,
    queueExecuteInterval,
    addToQueue,
    updateQueueItems
  } = useExecutionQueue<TxnStatusItem>({
    queueName: 'Transaction status queue',
    executeInterval: 2000,
    queueExecutor,
    updateItemsInQueue: updateAllExecutedItems
  });

  const backoffExpMultiplier = 2;
  const backoffBaseInterval = 10000;

  const addTransactionStatusCheckItem: TransactionStatusProviderInterface['addTransactionStatusCheckItem'] =
    (txn, options) => {
      const coinData = COINS[txn.parentCoinId || txn.coinId];

      if (!coinData) {
        logger.warn('Invalid coin found', {
          txn,
          coinId: txn.coinId,
          parentCoinId: txn.parentCoinId
        });
        return;
      }

      const newItem = new TxnStatusItem({
        accountId: txn.accountId,
        coinId: txn.coinId,
        parentCoinId: txn.parentCoinId,
        walletId: txn.walletId,
        txnHash: txn.hash,
        sender: txn.outputs[0]?.address,
        coinGroup: coinData.group,
        module: 'refresh',
        parentCoin: txn.coin,
        isRefresh: options?.isRefresh,
        backoffTime: backoffBaseInterval
      });
      addToQueue(newItem);
    };

  // fetch all pending transactions and push them into status check queue
  const setupInitial = async () => {
    logger.info('TransactionStatus: Adding Initial items');
    if (process.env.IS_PRODUCTION === 'true') {
      const allPendingTxns = await transactionDb.getAll({
        status: Status.PENDING
      });

      if (allPendingTxns.length === 0) return;

      allPendingTxns.forEach(txnItem => {
        addTransactionStatusCheckItem(txnItem, { isRefresh: true });
      });
    }
  };

  // setup initial pending transaction status check
  useEffect(() => {
    setupInitial();
    transactionDb.failExpiredTxn();
    setInitialSetupDone(true);
  }, []);

  return (
    <StatusCheckContext.Provider
      value={{
        addTransactionStatusCheckItem
      }}
    >
      {children}
    </StatusCheckContext.Provider>
  );
};

TransactionStatusProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useStatusCheck(): TransactionStatusProviderInterface {
  return React.useContext(StatusCheckContext);
}
