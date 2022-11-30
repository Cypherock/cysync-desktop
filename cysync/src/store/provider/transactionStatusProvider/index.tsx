import { COINS } from '@cypherock/communication';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

import logger from '../../../utils/logger';
import { coinDb, Status, Transaction, transactionDb } from '../../database';
import { useNetwork } from '../networkProvider';
import { RESYNC_INTERVAL, sleep, useSync } from '../syncProvider';

import { executeBatchCheck, ExecutionResult } from './sync';
import { TxnStatusItem } from './txnStatusItem';

const BATCH_SIZE = 5;

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
  const [txnStatusQueue, setTxnStatusQueue] = React.useState<TxnStatusItem[]>(
    []
  );
  const [isExecutingTask, setIsExecutingTask] = React.useState(false);
  const { addBalanceSyncItemFromCoin, addHistorySyncItemFromCoin } = useSync();

  const queueExecuteInterval = 2000;
  const backoffExpMultiplier = 2;
  const backoffBaseInterval = 10000;

  const { connected } = useNetwork();
  const connectedRef = useRef<boolean | null>(connected);

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  const addToQueue = (item: TxnStatusItem) => {
    setTxnStatusQueue(currentTxnQueue => {
      if (currentTxnQueue.findIndex(elem => elem.equals(item)) === -1) {
        return [...currentTxnQueue, item];
      }
      return currentTxnQueue;
    });
  };

  const addTransactionStatusCheckItem = (
    txn: Transaction,
    { isRefresh = false }
  ) => {
    const coinData = COINS[txn.coin || txn.slug];

    if (!coinData) {
      logger.warn('Invalid coin found', {
        txn,
        coinType: txn.coin || txn.slug
      });
      return;
    }

    const newItem = new TxnStatusItem({
      walletId: txn.walletId,
      txnHash: txn.hash,
      sender: txn.outputs[0]?.address,
      coinType: coinData.abbr,
      coinGroup: coinData.group,
      isRefresh,
      backoffTime: backoffBaseInterval
    });
    addToQueue(newItem);
  };

  const updateAllExecutedItems = async (
    executionResults: ExecutionResult[]
  ) => {
    const syncQueueUpdateOperations: Array<{
      item: TxnStatusItem;
      operation: 'remove' | 'update';
      updatedItem?: TxnStatusItem;
    }> = [];

    for (const result of executionResults) {
      const { item } = result;
      const updatedItem = item.clone();
      let removeFromQueue = true;

      if (result.isFailed || !result.isComplete) {
        removeFromQueue = false;
        updatedItem.backoffFactor *= backoffExpMultiplier;
        updatedItem.backoffTime =
          updatedItem.backoffFactor * backoffBaseInterval;

        // not very precise; next history sync might be very near in time
        // ineffective in reducing API calls, helpful to shorten the txnStatusQueue
        if (updatedItem.backoffTime > RESYNC_INTERVAL) removeFromQueue = true;
      }

      syncQueueUpdateOperations.push({
        operation: removeFromQueue ? 'remove' : 'update',
        item,
        updatedItem
      });

      // no need for resync as transaction is incomplete; skipping it
      if (result.isComplete !== true) continue;

      try {
        // status is final, resync balances and history
        const coinEntry = await coinDb.getOne({
          walletId: item.walletId,
          slug: item.coinType
        });
        addBalanceSyncItemFromCoin(
          {
            ...coinEntry,
            coinGroup: item.coinGroup,
            parentCoin: item.parentCoin
          },
          {}
        );
        addHistorySyncItemFromCoin(
          {
            ...coinEntry,
            coinGroup: item.coinGroup,
            parentCoin: item.parentCoin
          },
          {}
        );
      } catch (e) {
        logger.error('Failed to sync after transaction status update', e, item);
      }
    }

    setTxnStatusQueue(currentSyncQueue => {
      const duplicate = [...currentSyncQueue];

      for (const operation of syncQueueUpdateOperations) {
        const index = duplicate.findIndex(elem => elem.equals(operation.item));
        if (index === -1) {
          logger.warn('Cannot find item index while updating sync queue');
          continue;
        }

        if (operation.operation === 'remove') {
          duplicate.splice(index, 1);
        } else if (operation.operation === 'update' && operation.updatedItem) {
          duplicate[index] = operation.updatedItem;
        }
      }

      return duplicate;
    });
  };

  // pick, batch and execute the queued request items and finally update the queue
  const executeNextInQueue = async () => {
    setIsExecutingTask(true);

    let items: TxnStatusItem[] = [];

    if (txnStatusQueue.length > 0) {
      // deduct the backoff time
      // this is not accurate; actual backoff is (backoff + queue processing)
      txnStatusQueue.forEach(ele => {
        ele.backoffTime = Math.max(0, ele.backoffTime - queueExecuteInterval);
      });

      // filter items ready for execution i.e. backoffTime is 0
      items = txnStatusQueue.filter(
        ele => ele.backoffTime <= queueExecuteInterval
      );
    }

    if (connected && txnStatusQueue.length > 0 && items.length > 0) {
      const array = await executeBatchCheck(items.slice(0, BATCH_SIZE));
      await updateAllExecutedItems(
        array.reduce((acc, item) => acc.concat(item), [])
      );
    }

    await sleep(queueExecuteInterval);
    setIsExecutingTask(false);
  };

  // fetch all pending transactions and push them into status check queue
  const setupInitial = async () => {
    logger.info('Sync: Adding Initial items');
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
  }, []);

  // execute transaction status checks
  useEffect(() => {
    if (!isExecutingTask) executeNextInQueue();
  }, [isExecutingTask]);

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
