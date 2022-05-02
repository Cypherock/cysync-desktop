import {
  ALLCOINS,
  BtcCoinData,
  COINS,
  EthCoinData
} from '@cypherock/communication';
import { Xpub } from '@cypherock/database';
import crypto from 'crypto';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

import logger from '../../../utils/logger';
import { erc20tokenDb, priceDb, transactionDb, xpubDb } from '../../database';
import { useNetwork } from '../networkProvider';
import { useNotifications } from '../notificationProvider';

import { executeBatch, ExecutionResult } from './executors';
import {
  BalanceSyncItem,
  HistorySyncItem,
  LatestPriceSyncItem,
  PriceSyncItem,
  PriceSyncItemOptions,
  SyncItem,
  SyncProviderTypes,
  SyncQueueItem
} from './types';

const BATCH_SIZE = 5;

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface SyncContextInterface {
  isSyncing: boolean;
  isWaitingForConnection: boolean;
  modulesInExecutionQueue: string[];
  addCoinTask: (xpub: Xpub, options: { module: string }) => void;
  addTokenTask: (
    walletId: string,
    tokenName: string,
    ethCoin: string
  ) => Promise<void>;
  reSync: () => void;
  addBalanceSyncItemFromXpub: (
    xpub: Xpub,
    options: { token?: string; module?: string; isRefresh?: boolean }
  ) => void;
  addHistorySyncItemFromXpub: (
    xpub: Xpub,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
}

export const SyncContext: React.Context<SyncContextInterface> =
  React.createContext<SyncContextInterface>({} as SyncContextInterface);

export const SyncProvider: React.FC = ({ children }) => {
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isWaitingForConnection, setWaitingForConnection] =
    React.useState(false);
  const [isInitialSetupDone, setInitialSetupDone] = React.useState(false);
  const [isExecutingTask, setIsExecutingTask] = React.useState(false);
  const [modulesInExecutionQueue, setModuleInExecutionQueue] = React.useState<
    string[]
  >([]);
  const [syncQueue, setSyncQueue] = React.useState<SyncQueueItem[]>([]);
  const notifications = useNotifications();

  const queueExecuteInterval = 1000;
  const maxRetries = 2;

  const { connected } = useNetwork();

  const addToQueue: SyncProviderTypes['addToQueue'] = item => {
    setSyncQueue(currentSyncQueue => {
      if (currentSyncQueue.findIndex(elem => elem.equals(item)) === -1) {
        // Adds the current item to ModuleExecutionQueue
        setModuleInExecutionQueue(currentModuleQueue => {
          if (!currentModuleQueue.includes(item.module)) {
            return [...currentModuleQueue, item.module];
          }
          return currentModuleQueue;
        });

        return [...currentSyncQueue, item];
      }
      return currentSyncQueue;
    });
  };

  const addHistorySyncItemFromXpub: SyncProviderTypes['addHistorySyncItemFromXpub'] =
    async (xpub: Xpub, { module = 'default', isRefresh = false }) => {
      const coin = COINS[xpub.coin];

      if (!coin) {
        logger.warn('Xpub with invalid coin found', {
          coin,
          coinType: xpub.coin
        });
        logger.debug('Xpub with invalid coin found', {
          coin,
          coinType: xpub.coin,
          xpub
        });
        return;
      }

      if (coin instanceof BtcCoinData) {
        const walletName = crypto
          .createHash('sha256')
          .update(xpub.xpub)
          .digest('base64');
        const transactionHistory = await transactionDb.getAll(
          {
            walletId: xpub.walletId,
            walletName,
            coin: coin.abbr,
            excludeFailed: true,
            excludePending: true,
            minConfirmations: 6
          },
          { sort: 'blockHeight', order: 'd', limit: 1 }
        );
        const newItem = new HistorySyncItem({
          xpub: xpub.xpub,
          walletName,
          walletId: xpub.walletId,
          coinType: coin.abbr,
          isRefresh,
          module,
          afterBlock:
            transactionHistory.length > 0 &&
            transactionHistory[0].blockHeight > 0
              ? transactionHistory[0].blockHeight
              : undefined,
          page: 1
        });
        addToQueue(newItem);

        if (xpub.zpub) {
          const zwalletName = crypto
            .createHash('sha256')
            .update(xpub.zpub)
            .digest('base64');
          const ztransactionHistory = await transactionDb.getAll(
            {
              walletId: xpub.walletId,
              walletName: zwalletName,
              coin: coin.abbr,
              excludeFailed: true,
              excludePending: true,
              minConfirmations: 6
            },
            { sort: 'blockHeight', order: 'd', limit: 1 }
          );
          const newZItem = new HistorySyncItem({
            xpub: xpub.xpub,
            zpub: xpub.zpub,
            walletName: zwalletName,
            walletId: xpub.walletId,
            coinType: coin.abbr,
            isRefresh,
            module,
            afterBlock:
              ztransactionHistory.length > 0 &&
              ztransactionHistory[0].blockHeight > 0
                ? ztransactionHistory[0].blockHeight
                : undefined,
            page: 1
          });
          addToQueue(newZItem);
        }
      } else if (coin instanceof EthCoinData) {
        const newItem = new HistorySyncItem({
          xpub: xpub.xpub,
          walletName: '',
          walletId: xpub.walletId,
          coinType: coin.abbr,
          isRefresh,
          module
        });
        addToQueue(newItem);
      } else {
        logger.warn('Xpub with invalid coin found', {
          coin,
          coinType: xpub.coin
        });
        logger.debug('Xpub with invalid coin found', {
          coin,
          coinType: xpub.coin,
          xpub
        });
      }
    };

  const addBalanceSyncItemFromXpub: SyncProviderTypes['addBalanceSyncItemFromXpub'] =
    (xpub: Xpub, { token, module = 'default', isRefresh = false }) => {
      const coin = COINS[xpub.coin];

      if (!coin) {
        logger.warn('Xpub with invalid coin found', {
          coin,
          coinType: xpub.coin
        });
        logger.debug('Xpub with invalid coin found', {
          coin,
          coinType: xpub.coin,
          xpub
        });
        return;
      }

      // If a token txn, refresh eth as well as token balance
      if (token) {
        addToQueue(
          new BalanceSyncItem({
            xpub: xpub.xpub,
            walletId: xpub.walletId,
            coinType: token,
            ethCoin: xpub.coin,
            module,
            isRefresh
          })
        );
      }

      if (coin.isEth) {
        addToQueue(
          new BalanceSyncItem({
            xpub: xpub.xpub,
            zpub: xpub.zpub,
            walletId: xpub.walletId,
            coinType: xpub.coin,
            module,
            isRefresh
          })
        );
      } else {
        // If BTC fork, we get the balance from the txn api
        addHistorySyncItemFromXpub(xpub, { module, isRefresh });
      }
    };

  const addPriceSyncItemFromXpub: SyncProviderTypes['addPriceSyncItemFromXpub'] =
    async (xpub: Xpub, { module = 'default', isRefresh = false }) => {
      const coinName = xpub.coin;

      const coin = ALLCOINS[coinName];

      if (!coin) {
        logger.warn('Invalid coin in add price sync item', {
          coinType: coinName
        });
        return;
      }

      if (!coin.isTest) {
        for (const days of [7, 30, 365] as Array<
          PriceSyncItemOptions['days']
        >) {
          const oldPrices = await priceDb.getPrice(coin.abbr, days);
          let addNew = true;

          // Check if the prices and old enough and then only add to sync
          if (oldPrices && oldPrices.data && oldPrices.data.length > 2) {
            const oldestPriceEntry = oldPrices.data[oldPrices.data.length - 1];
            const secondOldestPriceEntry =
              oldPrices.data[oldPrices.data.length - 2];
            const interval = oldestPriceEntry[0] - secondOldestPriceEntry[0];
            const currentTime = new Date().getTime();
            const nextLatestTime = oldestPriceEntry[0] + interval;

            if (nextLatestTime > currentTime) {
              addNew = false;
            }
          }

          if (addNew) {
            const newItem = new PriceSyncItem({
              days,
              coinType: coin.abbr,
              isRefresh,
              module
            });
            addToQueue(newItem);
          }
        }
      }
    };

  const addLatestPriceSyncItemFromXpub: SyncProviderTypes['addLatestPriceSyncItemFromXpub'] =
    (xpub: Xpub, { module = 'default', isRefresh = false }) => {
      const coinName = xpub.coin;

      const coin = ALLCOINS[coinName];

      if (!coin) {
        logger.warn('Invalid coin in add latest price sync item', {
          coinType: coinName
        });
        return;
      }

      if (!coin.isTest) {
        const newItem = new LatestPriceSyncItem({
          coinType: coin.abbr,
          isRefresh,
          module
        });
        addToQueue(newItem);
      }
    };

  const updateAllExecutedItems = async (
    executionResults: ExecutionResult[]
  ) => {
    const allCompletedModulesSet: Set<string> = new Set<string>();
    const syncQueueUpdateOperations: Array<{
      item: SyncQueueItem;
      operation: 'remove' | 'update';
      updatedItem?: SyncQueueItem;
    }> = [];

    for (const result of executionResults) {
      const { item } = result;

      let removeFromQueue = true;
      let updateQueueItem = false;
      const updatedItem = item.clone();

      if (result.isFailed) {
        if (item.retries < maxRetries && result.canRetry) {
          logger.warn('Sync: Error, retrying...', { item });
          updatedItem.retries += 1;

          updateQueueItem = true;
          removeFromQueue = false;
        } else {
          logger.error('Sync: Error, max retries exceeded', { item });
          logger.error(result.error);
        }
      } else if (
        item instanceof HistorySyncItem &&
        result.processResult !== undefined
      ) {
        removeFromQueue = false;
        updateQueueItem = true;
        (updatedItem as HistorySyncItem).page = result.processResult.page;
        (updatedItem as HistorySyncItem).afterBlock =
          result.processResult.after;
      }

      if (removeFromQueue) {
        syncQueueUpdateOperations.push({ operation: 'remove', item });
        // Remove module from ModuleInExecutionQueue
        const { module } = item as SyncItem;
        allCompletedModulesSet.add(module);
      }

      if (updateQueueItem) {
        syncQueueUpdateOperations.push({
          operation: 'update',
          item,
          updatedItem
        });
      }
    }

    setSyncQueue(currentSyncQueue => {
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

      const allCompletedModules: string[] = [];
      for (const [module] of allCompletedModulesSet.entries()) {
        if (duplicate.findIndex(elem => elem.module === module) === -1) {
          allCompletedModules.push(module);
        }
      }

      setModuleInExecutionQueue(currentModules => {
        const duplicateModules = [...currentModules];

        return duplicateModules.filter(
          elem => !allCompletedModules.includes(elem)
        );
      });

      return duplicate;
    });
  };

  const executeNextInQueue = async () => {
    setIsExecutingTask(true);
    if (!connected) {
      await sleep(queueExecuteInterval);
      setIsExecutingTask(false);
      return;
    }

    let items: SyncQueueItem[] = [];
    if (syncQueue.length > 0) {
      items = syncQueue.slice(0, BATCH_SIZE);
    }

    if (items.length <= 0) {
      await sleep(queueExecuteInterval);
      setIsExecutingTask(false);
      return;
    }

    try {
      const executionResult = await executeBatch(items, {
        addToQueue,
        addPriceSyncItemFromXpub,
        addLatestPriceSyncItemFromXpub
      });

      updateAllExecutedItems(executionResult);
    } catch (error) {
      logger.error('Failed to execute batch, hence failing all tasks');
    }

    await sleep(queueExecuteInterval);
    setIsExecutingTask(false);
  };

  const addHistoryRefresh = async ({
    isRefresh = false,
    module = 'default'
  }) => {
    const allXpubs = await xpubDb.getAll();
    for (const xpub of allXpubs) {
      addHistorySyncItemFromXpub(xpub, { isRefresh, module });
    }
  };

  const addBalanceRefresh = async ({
    isRefresh = false,
    module = 'default'
  }) => {
    const allXpubs = await xpubDb.getAll();
    const tokens = await erc20tokenDb.getAll();

    for (const xpub of allXpubs) {
      addBalanceSyncItemFromXpub(xpub, { isRefresh, module });
    }

    for (const token of tokens) {
      const ethXpub = await xpubDb.getByWalletIdandCoin(
        token.walletId,
        token.ethCoin
      );
      if (!ethXpub) {
        logger.warn('EthCoin does not exist', { ethCoin: token.ethCoin });
        return;
      }
      addToQueue(
        new BalanceSyncItem({
          xpub: ethXpub.xpub,
          walletId: token.walletId,
          coinType: token.coin,
          ethCoin: token.ethCoin,
          module,
          isRefresh
        })
      );
    }
  };

  const addPriceRefresh = async ({ isRefresh = false, module = 'default' }) => {
    const allXpubs = await xpubDb.getAll();
    const tokens = await erc20tokenDb.getAll();

    for (const xpub of allXpubs) {
      addPriceSyncItemFromXpub(xpub, { isRefresh, module });
    }

    for (const token of tokens) {
      addPriceSyncItemFromXpub({ coin: token.coin } as Xpub, {
        isRefresh,
        module
      });
    }
  };

  const addLatestPriceRefresh = async ({
    isRefresh = false,
    module = 'default'
  }) => {
    const allXpubs = await xpubDb.getAll();
    const tokens = await erc20tokenDb.getAll();

    for (const xpub of allXpubs) {
      addLatestPriceSyncItemFromXpub(xpub, { isRefresh, module });
    }

    for (const token of tokens) {
      addLatestPriceSyncItemFromXpub({ coin: token.coin } as Xpub, {
        isRefresh,
        module
      });
    }
  };

  const addCoinTask = (xpub: Xpub, { module = 'default' }) => {
    addBalanceSyncItemFromXpub(xpub, { module, isRefresh: true });
    addHistorySyncItemFromXpub(xpub, { module, isRefresh: true });
    addPriceSyncItemFromXpub(xpub, { module, isRefresh: true });
    addLatestPriceSyncItemFromXpub(xpub, { module, isRefresh: true });
  };

  const addTokenTask = async (
    walletId: string,
    tokenName: string,
    ethCoin: string
  ) => {
    const ethXpub = await xpubDb.getByWalletIdandCoin(walletId, ethCoin);
    if (!ethXpub) {
      logger.warn('EthCoin does not exist', { walletId, ethCoin });
      return;
    }
    addToQueue(
      new BalanceSyncItem({
        xpub: ethXpub.xpub,
        walletId,
        coinType: tokenName,
        ethCoin,
        module: 'default',
        isRefresh: true
      })
    );
    addPriceSyncItemFromXpub({ coin: tokenName } as Xpub, {
      isRefresh: true,
      module: 'default'
    });
    addLatestPriceSyncItemFromXpub({ coin: tokenName } as Xpub, {
      isRefresh: true,
      module: 'default'
    });
  };

  const setupInitial = async () => {
    logger.info('Sync: Adding Initial items');
    if (process.env.IS_PRODUCTION === 'true') {
      await addBalanceRefresh({ isRefresh: true });
      await addHistoryRefresh({ isRefresh: true });
      await addPriceRefresh({ isRefresh: true });
      await addLatestPriceRefresh({ isRefresh: true });
    }

    setInitialSetupDone(true);
  };

  const reSync = async () => {
    logger.info('Sync: ReSyncing items');

    await addBalanceRefresh({ isRefresh: true });
    await addHistoryRefresh({ isRefresh: true });
    await addPriceRefresh({ isRefresh: true });
    await addLatestPriceRefresh({ isRefresh: true });
    await notifications.getLatest();
  };

  const intervals = useRef<NodeJS.Timeout[]>([]);
  useEffect(() => {
    transactionDb.failExpiredTxn();
    setupInitial();

    // Refresh after 60 mins
    if (intervals.current.length === 0) {
      intervals.current.push(
        setInterval(async () => {
          if (connected && process.env.IS_PRODUCTION === 'true') {
            logger.info('Sync: Refresh triggered');
            try {
              addPriceRefresh({ isRefresh: true, module: 'refresh' });
              await notifications.getLatest();
              await transactionDb.failExpiredTxn();
            } catch (error) {
              logger.error('Sync: Error in refresh');
              logger.error(error);
            }
          }
        }, 1000 * 60 * 60)
      );

      // Refresh after 15 mins
      intervals.current.push(
        setInterval(async () => {
          if (connected && process.env.IS_PRODUCTION === 'true') {
            logger.info('Sync: Refresh triggered for latest price');
            try {
              addLatestPriceRefresh({ isRefresh: true, module: 'refresh' });
            } catch (error) {
              logger.error('Sync: Error in refreshing latest price');
              logger.error(error);
            }
          }
        }, 1000 * 60 * 15)
      );
    }
    return () => {
      intervals.current.forEach(interval => clearInterval(interval));
      intervals.current = [] as NodeJS.Timeout[];
    };
  }, []);

  // Sets if the sync is 'on' or 'off'
  useEffect(() => {
    if (syncQueue.length > 0) {
      if (connected && isInitialSetupDone) {
        if (isWaitingForConnection) {
          setWaitingForConnection(false);
        }

        setIsSyncing(true);
      } else if (isInitialSetupDone) {
        setWaitingForConnection(true);
      }
    } else {
      setIsSyncing(false);
    }
  }, [connected, isInitialSetupDone, syncQueue]);

  // Execute the syncItems if it is syncing
  useEffect(() => {
    if (isSyncing && !isWaitingForConnection && !isExecutingTask) {
      executeNextInQueue();
    }
  }, [isSyncing, isExecutingTask, isWaitingForConnection]);

  return (
    <SyncContext.Provider
      value={{
        isSyncing,
        isWaitingForConnection,
        modulesInExecutionQueue,
        addCoinTask,
        addTokenTask,
        reSync,
        addBalanceSyncItemFromXpub,
        addHistorySyncItemFromXpub
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

SyncProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useSync(): SyncContextInterface {
  return React.useContext(SyncContext);
}
