import {
  ALLCOINS,
  BtcCoinData,
  coinGroup,
  COINS,
  EthCoinData,
  NearCoinData
} from '@cypherock/communication';
import crypto from 'crypto';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

import logger from '../../../utils/logger';
import {
  Coin,
  coinDb,
  getTopBlock,
  priceHistoryDb,
  tokenDb,
  transactionDb
} from '../../database';
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
  addCoinTask: (coin: Coin, options: { module: string }) => void;
  addTokenTask: (
    walletId: string,
    tokenName: string,
    ethCoin: string
  ) => Promise<void>;
  reSync: () => void;
  addBalanceSyncItemFromCoin: (
    coin: Coin,
    options: { token?: string; module?: string; isRefresh?: boolean }
  ) => void;
  addHistorySyncItemFromCoin: (
    coin: Coin,
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
  const connectedRef = useRef<boolean | null>(connected);

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

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

  const addHistorySyncItemFromCoin: SyncProviderTypes['addHistorySyncItemFromCoin'] =
    async (coin: Coin, { module = 'default', isRefresh = false }) => {
      const coinData = COINS[coin.slug];

      if (!coinData) {
        logger.warn('Xpub with invalid coin found', {
          coin,
          coinType: coin.slug
        });
        logger.debug(
          'Xpub with invalid coin found addHistorySyncItemFromCoin',
          {
            coinData,
            coinType: coin.slug,
            coin
          }
        );
        return;
      }

      if (coinData instanceof BtcCoinData) {
        let topBlock;
        const walletName = crypto
          .createHash('sha256')
          .update(coin.xpub)
          .digest('base64');
        topBlock = await getTopBlock(
          {
            walletId: coin.walletId,
            walletName,
            slug: coinData.abbr
          },
          {
            excludeFailed: true,
            excludePending: true,
            minConfirmations: 6
          }
        );
        const newItem = new HistorySyncItem({
          xpub: coin.xpub,
          walletName,
          walletId: coin.walletId,
          coinType: coinData.abbr,
          isRefresh,
          module,
          afterBlock: topBlock,
          page: 1
        });
        addToQueue(newItem);

        if (coin.zpub) {
          const zwalletName = crypto
            .createHash('sha256')
            .update(coin.zpub)
            .digest('base64');
          topBlock = await getTopBlock(
            {
              walletId: coin.walletId,
              walletName: zwalletName,
              slug: coinData.abbr
            },
            {
              excludeFailed: true,
              excludePending: true,
              minConfirmations: 6
            }
          );
          const newZItem = new HistorySyncItem({
            xpub: coin.xpub,
            zpub: coin.zpub,
            walletName: zwalletName,
            walletId: coin.walletId,
            coinType: coinData.abbr,
            isRefresh,
            module,
            afterBlock: topBlock,
            page: 1
          });
          addToQueue(newZItem);
        }
      } else if (coinData instanceof EthCoinData) {
        const newItem = new HistorySyncItem({
          xpub: coin.xpub,
          walletName: '',
          walletId: coin.walletId,
          coinType: coinData.abbr,
          isRefresh,
          module
        });
        addToQueue(newItem);
      } else if (coinData instanceof NearCoinData) {
        const newItem = new HistorySyncItem({
          xpub: coin.xpub,
          walletName: '',
          walletId: coin.walletId,
          coinType: coinData.abbr,
          isRefresh,
          module
        });
        addToQueue(newItem);
      } else {
        logger.warn('Xpub with invalid coin found', {
          coinData,
          coinType: coin.slug
        });
        logger.debug('Xpub with invalid coin found', {
          coinData,
          coinType: coin.slug,
          coin
        });
      }
    };

  const addBalanceSyncItemFromCoin: SyncProviderTypes['addBalanceSyncItemFromCoin'] =
    (coin: Coin, { token, module = 'default', isRefresh = false }) => {
      const coinData = COINS[coin.slug];

      if (!coinData) {
        logger.warn('Xpub with invalid coin found', {
          coinData,
          coinType: coin.slug
        });
        logger.debug(
          'Xpub with invalid coin found addBalanceSyncItemFromCoin',
          {
            coinData,
            coinType: coin.slug,
            coin
          }
        );
        return;
      }

      // If a token txn, refresh eth as well as token balance
      if (token) {
        addToQueue(
          new BalanceSyncItem({
            xpub: coin.xpub,
            walletId: coin.walletId,
            coinType: token,
            ethCoin: coin.slug,
            module,
            isRefresh
          })
        );
      }

      if (coinData.group === coinGroup.Ethereum) {
        addToQueue(
          new BalanceSyncItem({
            xpub: coin.xpub,
            zpub: coin.zpub,
            walletId: coin.walletId,
            coinType: coin.slug,
            module,
            isRefresh
          })
        );
      } else {
        // If BTC fork, we get the balance from the txn api
        addHistorySyncItemFromCoin(coin, { module, isRefresh });
      }
    };

  const addPriceSyncItemFromCoin: SyncProviderTypes['addPriceSyncItemFromCoin'] =
    async (coin: Coin, { module = 'default', isRefresh = false }) => {
      const coinName = coin.slug;

      const coinData = ALLCOINS[coinName];

      if (!coin) {
        logger.warn('Invalid coin in add price sync item', {
          coinType: coinName
        });
        return;
      }

      if (!coinData.isTest) {
        for (const days of [7, 30, 365] as Array<
          PriceSyncItemOptions['days']
        >) {
          const oldPrices = await priceHistoryDb.getOne({
            slug: coinData.abbr,
            interval: days
          });
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
              coinType: coinData.abbr,
              isRefresh,
              module
            });
            addToQueue(newItem);
          }
        }
      }
    };

  const addLatestPriceSyncItemFromCoin: SyncProviderTypes['addLatestPriceSyncItemFromCoin'] =
    (coin: Coin, { module = 'default', isRefresh = false }) => {
      const coinName = coin.slug;

      const coinData = ALLCOINS[coinName];

      if (!coin) {
        logger.warn('Invalid coin in add latest price sync item', {
          coinType: coinName
        });
        return;
      }

      if (!coinData.isTest) {
        const newItem = new LatestPriceSyncItem({
          coinType: coinData.abbr,
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
        addPriceSyncItemFromCoin,
        addLatestPriceSyncItemFromCoin
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
    const allXpubs = await coinDb.getAll();
    for (const xpub of allXpubs) {
      addHistorySyncItemFromCoin(xpub, { isRefresh, module });
    }
  };

  const addBalanceRefresh = async ({
    isRefresh = false,
    module = 'default'
  }) => {
    const coins = await coinDb.getAll();
    const tokens = await tokenDb.getAll();

    for (const coin of coins) {
      addBalanceSyncItemFromCoin(coin, { isRefresh, module });
    }

    for (const token of tokens) {
      const ethXpub = await coinDb.getOne({
        walletId: token.walletId,
        slug: token.coin
      });
      if (!ethXpub) {
        logger.warn('EthCoin does not exist', { ethCoin: token.coin });
        return;
      }
      addToQueue(
        new BalanceSyncItem({
          xpub: ethXpub.xpub,
          walletId: token.walletId,
          coinType: token.coin,
          ethCoin: token.coin,
          module,
          isRefresh
        })
      );
    }
  };

  const addPriceRefresh = async ({ isRefresh = false, module = 'default' }) => {
    const allXpubs = await coinDb.getAll();
    const tokens = await tokenDb.getAll();

    for (const xpub of allXpubs) {
      addPriceSyncItemFromCoin(xpub, { isRefresh, module });
    }

    for (const token of tokens) {
      addPriceSyncItemFromCoin({ slug: token.coin } as Coin, {
        isRefresh,
        module
      });
    }
  };

  const addLatestPriceRefresh = async ({
    isRefresh = false,
    module = 'default'
  }) => {
    const allXpubs = await coinDb.getAll();
    const tokens = await tokenDb.getAll();

    for (const xpub of allXpubs) {
      addLatestPriceSyncItemFromCoin(xpub, { isRefresh, module });
    }

    for (const token of tokens) {
      addLatestPriceSyncItemFromCoin({ slug: token.coin } as Coin, {
        isRefresh,
        module
      });
    }
  };

  const addCoinTask = (coin: Coin, { module = 'default' }) => {
    addBalanceSyncItemFromCoin(coin, { module, isRefresh: true });
    addHistorySyncItemFromCoin(coin, { module, isRefresh: true });
    addPriceSyncItemFromCoin(coin, { module, isRefresh: true });
    addLatestPriceSyncItemFromCoin(coin, { module, isRefresh: true });
  };

  const addTokenTask = async (
    walletId: string,
    tokenName: string,
    ethCoin: string
  ) => {
    const ethXpub = await coinDb.getOne({ walletId, slug: ethCoin });
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
    addPriceSyncItemFromCoin({ slug: tokenName } as Coin, {
      isRefresh: true,
      module: 'default'
    });
    addLatestPriceSyncItemFromCoin({ slug: tokenName } as Coin, {
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

    await addBalanceRefresh({});
    await addHistoryRefresh({});
    await addPriceRefresh({});
    await addLatestPriceRefresh({});
    await notifications.updateLatest();
  };

  const intervals = useRef<NodeJS.Timeout[]>([]);
  useEffect(() => {
    transactionDb.failExpiredTxn();
    setupInitial();

    // Refresh after 60 mins
    if (
      intervals.current.length === 0 &&
      process.env.IS_PRODUCTION === 'true'
    ) {
      intervals.current.push(
        setInterval(async () => {
          logger.info('Sync: Refresh triggered');
          // Needs refactor
          addPriceRefresh({ isRefresh: true, module: 'refresh' })
            .then(() => {
              logger.info('Sync: Price Refresh completed');
            })
            .catch(err => {
              logger.error('Sync: Price Refresh failed', err);
            });
          if (connectedRef) {
            notifications
              .updateLatest()
              .then(() => {
                logger.info('Sync: Notification Refresh completed');
              })
              .catch(err => {
                logger.error('Sync: Notification Refresh failed', err);
              });
          }
          transactionDb
            .failExpiredTxn()
            .then(() => {
              logger.info('Sync: Transaction Refresh completed');
            })
            .catch(err => {
              logger.error('Sync: Transaction Refresh failed', err);
            });
        }, 1000 * 60 * 60)
      );

      // Refresh after 15 mins
      intervals.current.push(
        setInterval(async () => {
          logger.info('Sync: Refresh triggered for latest price');
          try {
            addLatestPriceRefresh({ isRefresh: true, module: 'refresh' });
          } catch (error) {
            logger.error('Sync: Error in refreshing latest price');
            logger.error(error);
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
        addBalanceSyncItemFromCoin,
        addHistorySyncItemFromCoin
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
