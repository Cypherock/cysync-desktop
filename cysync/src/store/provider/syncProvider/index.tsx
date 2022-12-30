import {
  AbsCoinData,
  BtcCoinData,
  CoinGroup,
  COINS,
  EthCoinData,
  NearCoinData,
  NearCoinMap,
  SolanaCoinData
} from '@cypherock/communication';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

import { CysyncError } from '../../../errors';
import logger from '../../../utils/logger';
import {
  Account,
  accountDb,
  customAccountDb,
  getTopBlock,
  getTopHash,
  priceHistoryDb,
  tokenDb,
  transactionDb
} from '../../database';
import { ExecutionResult } from '../../hooks';
import { useExecutionQueue } from '../../hooks/useExecutionQueue';
import { useNotifications } from '../notificationProvider';

import { executeBatch, executeLatestPriceBatch } from './executors';
import {
  BalanceSyncItem,
  ClientTimeoutInterface,
  CustomAccountSyncItem,
  HistorySyncItem,
  LatestPriceSyncItem,
  ModifiedAccount,
  PriceSyncItem,
  PriceSyncItemOptions,
  SyncProviderTypes,
  SyncQueueItem
} from './types';

export const RESYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes or 300000 ms

export const SyncModules = {
  INITIAL_RESYNC: 'initial-resync',
  AUTO_RESYNC: 'auto-resync',
  MANUAL_RESYNC: 'manual-resync',
  PRICE_RESYNC: 'price-resync',
  LATEST_PRICE_RESYNC: 'latest-price-resync'
};

export interface SyncContextInterface {
  isSyncing: boolean;
  isWaitingForConnection: boolean;
  modulesInExecutionQueue: string[];
  addCoinTask: (account: ModifiedAccount, options: { module: string }) => void;
  reSync: () => void;
  addBalanceSyncItemFromCoin: (
    account: ModifiedAccount,
    options: {
      token?: string;
      module?: string;
      isRefresh?: boolean;
      customAccount?: string;
    }
  ) => void;
  addHistorySyncItemFromCoin: (
    account: ModifiedAccount,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
  addCustomAccountSyncItemFromCoin: (
    account: Account,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
}

export const SyncContext: React.Context<SyncContextInterface> =
  React.createContext<SyncContextInterface>({} as SyncContextInterface);

export const SyncProvider: React.FC = ({ children }) => {
  const BATCH_SIZE = 5;
  const [hasCoin, setHasCoin] = React.useState(false);
  const prevHasCoin = React.useRef(false);

  const updateAllExecutedItems = async (
    executionResults: Array<ExecutionResult<SyncQueueItem>>
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
          const errorMsg = result?.error?.toString() || result?.error;
          logger.warn('Sync: Error, retrying...', { item, error: errorMsg });
          updatedItem.retries += 1;
          if (result.delay) {
            clientTimeout.current = {
              pause: true,
              tryAfter: performance.now() + result.delay
            };
            logger.info('ClientBatch sync paused for CoinGeckoAPI');
          }
          updateQueueItem = true;
          removeFromQueue = false;
        } else {
          const errorMsg = result?.error?.toString() || result?.error;
          logger.error(
            `${CysyncError.SYNC_MAX_TRIES_EXCEEDED} Sync: Error, max retries exceeded`
          );
          logger.error({ error: errorMsg, item, stack: result.error?.stack });
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
        (updatedItem as HistorySyncItem).afterHash = result.processResult.until;
        (updatedItem as HistorySyncItem).beforeHash =
          result.processResult.before;
        (updatedItem as HistorySyncItem).afterTokenBlock =
          result.processResult.afterToken;
      }

      if (removeFromQueue) {
        syncQueueUpdateOperations.push({ operation: 'remove', item });
        // Remove module from ModuleInExecutionQueue
        const { module } = item as SyncQueueItem;
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
    updateQueueItems(syncQueueUpdateOperations, allCompletedModulesSet);
  };

  const executeNextClientItemInQueue = async () => {
    if (!connected) {
      return [];
    }

    const latestPriceItems = queue.filter(item => item.type === 'latestPrice');

    const items = queue.filter(item => item.type === 'price').splice(0, 1);

    try {
      if (clientTimeout.current.pause) {
        if (performance.now() >= clientTimeout.current.tryAfter) {
          clientTimeout.current = { pause: false, tryAfter: 0 };
          logger.info('Waiting complete');
        } else {
          return [];
        }
      }
      let latestPriceResult: Array<ExecutionResult<SyncQueueItem>> = [];
      if (latestPriceItems.length > 0) {
        latestPriceResult = await executeLatestPriceBatch(
          latestPriceItems as LatestPriceSyncItem[],
          {
            addToQueue,
            addPriceSyncItemFromAccount: addPriceSyncItemFromCoin,
            addLatestPriceSyncItemFromAccount: addLatestPriceSyncItemFromCoin
          }
        );
      }
      const executionResult = await executeBatch(items, {
        addToQueue,
        addPriceSyncItemFromAccount: addPriceSyncItemFromCoin,
        addLatestPriceSyncItemFromAccount: addLatestPriceSyncItemFromCoin,
        isClientBatch: true
      });

      return [...latestPriceResult, ...executionResult];
    } catch (error) {
      // Since all the tasks for an item are closely related, I understand why this is being done.
      // TODO: But we should aim to do better to handle a single failing.
      logger.error('Failed to execute batch, hence failing all tasks');
    }
  };

  const executeNextBatchItemInQueue = async () => {
    if (!connected) {
      return [];
    }

    let items: SyncQueueItem[] = [];

    if (queue.length > 0) {
      items = queue
        .filter(item => item.type !== 'price' && item.type !== 'latestPrice')
        .slice(0, BATCH_SIZE);
    }

    if (items.length <= 0) {
      return [];
    }

    try {
      const executionResult = await executeBatch(items, {
        addToQueue,
        addPriceSyncItemFromAccount: addPriceSyncItemFromCoin,
        addLatestPriceSyncItemFromAccount: addLatestPriceSyncItemFromCoin
      });
      return executionResult;
    } catch (error) {
      // Since all the tasks for an item are closely related, I understand why this is being done.
      // TODO: But we should aim to do better to handle a single failing.
      logger.error('Failed to execute batch, hence failing all tasks');
    }
  };

  const queueExecutor = async () => {
    return await Promise.all([
      executeNextBatchItemInQueue(),
      executeNextClientItemInQueue()
    ]);
  };

  const {
    connected,
    connectedRef,
    queue,
    modulesInExecutionQueue,
    isSyncing,
    isInitialSetupDone,
    setInitialSetupDone,
    isWaitingForConnection,
    addToQueue,
    updateQueueItems
  } = useExecutionQueue<SyncQueueItem>({
    queueName: 'Sync queue',
    executeInterval: 1000,
    queueExecutor,
    updateItemsInQueue: updateAllExecutedItems
  });
  const notifications = useNotifications();

  const maxRetries = 2;

  const clientTimeout = useRef<ClientTimeoutInterface>({
    pause: false,
    tryAfter: 0
  });

  const addHistorySyncItemFromCoin: SyncProviderTypes['addHistorySyncItemFromAccount'] =
    async (coin, { module = 'default', isRefresh = false }) => {
      const coinData = COINS[coin.coinId];

      if (!coinData) {
        logger.warn('Xpub with invalid coin found', {
          coin
        });
        logger.debug(
          'Xpub with invalid coin found addHistorySyncItemFromCoin',
          {
            coinData,
            coin
          }
        );
        return;
      }

      if (coinData instanceof BtcCoinData) {
        const topBlock = await getTopBlock(
          {
            accountId: coin.accountId,
            coinId: coin.coinId
          },
          {
            excludeFailed: true,
            excludePending: true,
            minConfirmations: 6
          }
        );
        const newItem = new HistorySyncItem({
          accountId: coin.accountId,
          coinId: coin.coinId,
          accountType: coin.accountType,
          xpub: coin.xpub,
          walletId: coin.walletId,
          isRefresh,
          module,
          afterBlock: topBlock,
          page: 1,
          coinGroup: CoinGroup.BitcoinForks
        });
        addToQueue(newItem);
      } else if (coinData instanceof EthCoinData) {
        const topBlock = await getTopBlock(
          {
            accountId: coin.accountId,
            coinId: coin.coinId,
            isSub: false
          },
          {
            excludeFailed: true,
            excludePending: true
          }
        );
        const topTokenBlock = await getTopBlock(
          {
            accountId: coin.accountId,
            parentCoinId: coin.coinId,
            isSub: true
          },
          {
            excludeFailed: true,
            excludePending: true
          }
        );
        const newItem = new HistorySyncItem({
          accountId: coin.accountId,
          accountType: coin.accountType,
          coinId: coin.coinId,
          xpub: coin.xpub,
          walletId: coin.walletId,
          afterBlock: topBlock,
          afterTokenBlock: topTokenBlock,
          isRefresh,
          module,
          coinGroup: CoinGroup.Ethereum
        });
        addToQueue(newItem);
      } else if (coinData instanceof NearCoinData) {
        const customAccounts = await customAccountDb.getAll({
          coinId: coin.coinId,
          accountId: coin.accountId
        });
        for (const account of customAccounts) {
          const customAccount = account.name;

          const topBlock = await getTopBlock(
            {
              accountId: coin.accountId,
              coinId: coin.coinId,
              customIdentifier: customAccount
            },
            {}
          );

          const newItem = new HistorySyncItem({
            accountId: coin.accountId,
            accountType: coin.accountType,
            coinId: coin.coinId,
            xpub: coin.xpub,
            walletId: coin.walletId,
            afterBlock: topBlock,
            coinGroup: CoinGroup.Near,
            isRefresh,
            customAccount,
            module
          });
          addToQueue(newItem);
        }
      } else if (coinData instanceof SolanaCoinData) {
        const topHash = await getTopHash(
          {
            accountId: coin.accountId,
            coinId: coin.coinId,
            status: 1
          },
          {}
        );

        const newItem = new HistorySyncItem({
          accountId: coin.accountId,
          accountType: coin.accountType,
          coinId: coin.coinId,
          xpub: coin.xpub,
          walletId: coin.walletId,
          afterHash: topHash,
          coinGroup: CoinGroup.Solana,
          isRefresh,
          module
        });
        addToQueue(newItem);
      } else {
        logger.warn('Xpub with invalid coin found', {
          coinData
        });
        logger.debug('Xpub with invalid coin found', {
          coinData,
          coin
        });
      }
    };

  const addBalanceSyncItemFromCoin: SyncProviderTypes['addBalanceSyncItemFromAccount'] =
    async (
      coin: ModifiedAccount,
      { module = 'default', isRefresh = false }
    ) => {
      // If a token txn, refresh eth as well as token balance
      if (coin.isSub) {
        addToQueue(
          new BalanceSyncItem({
            parentCoinId: coin.parentCoinId,
            coinId: coin.coinId,
            accountId: coin.accountId,
            accountType: coin.accountType,
            xpub: coin.xpub,
            walletId: coin.walletId,
            coinGroup: CoinGroup.ERC20Tokens,
            module,
            isRefresh
          })
        );
      }
      const coinData = COINS[coin.coinId];

      if (!coinData) {
        logger.warn('Xpub with invalid coin found', {
          coinData,
          coinId: coin.coinId
        });
        logger.debug(
          'Xpub with invalid coin found addBalanceSyncItemFromCoin',
          {
            coinData,
            coin
          }
        );
        return;
      }

      if (coinData.group === CoinGroup.Ethereum) {
        addToQueue(
          new BalanceSyncItem({
            coinId: coin.coinId,
            accountId: coin.accountId,
            accountType: coin.accountType,
            xpub: coin.xpub,
            walletId: coin.walletId,
            module,
            isRefresh,
            coinGroup: CoinGroup.Ethereum
          })
        );
      } else if (coinData.group === CoinGroup.Near) {
        const customAccounts = await customAccountDb.getAll({
          coinId: coin.coinId,
          walletId: coin.walletId
        });
        for (const account of customAccounts) {
          const customAccount = account.name;
          const newItem = new BalanceSyncItem({
            coinId: coin.coinId,
            accountId: coin.accountId,
            accountType: coin.accountType,
            xpub: coin.xpub,
            walletId: coin.walletId,
            isRefresh,
            coinGroup: CoinGroup.Near,
            module,
            customAccount
          });
          addToQueue(newItem);
        }
      } else if (coinData.group === CoinGroup.Solana) {
        const newItem = new BalanceSyncItem({
          coinId: coin.coinId,
          accountId: coin.accountId,
          accountType: coin.accountType,
          xpub: coin.xpub,
          walletId: coin.walletId,
          isRefresh,
          coinGroup: CoinGroup.Solana,
          module
        });
        addToQueue(newItem);
      } else {
        // If BTC fork, we get the balance from the txn api
        addHistorySyncItemFromCoin(coin, { module, isRefresh });
      }
    };

  const addCustomAccountSyncItemFromCoin: SyncProviderTypes['addCustomAccountSyncItemFromAccount'] =
    async (coin: Account, { module = 'default', isRefresh = false }) => {
      const coinData = COINS[coin.coinId];

      if (!coinData) {
        logger.warn('Xpub with invalid coin found', {
          coinData,
          coinId: coin.coinId
        });
        logger.debug(
          'Xpub with invalid coin found addCustomAccountSyncItemFromCoin',
          {
            coinData,
            coinId: coin.coinId,
            coin
          }
        );
        return;
      }

      if (coinData.group === CoinGroup.Near) {
        const newItem = new CustomAccountSyncItem({
          accountId: coin.accountId,
          coinId: coin.coinId,
          xpub: coin.xpub,
          walletId: coin.walletId,
          isRefresh,
          module
        });
        addToQueue(newItem);
      }
    };

  const addPriceSyncItemFromCoin: SyncProviderTypes['addPriceSyncItemFromAccount'] =
    async (coin, { module = 'default', isRefresh = false }) => {
      const coinId = coin.coinId;

      let coinData: AbsCoinData;

      if (coin.parentCoinId) {
        const parentCoinData = COINS[coin.parentCoinId];
        if (!parentCoinData) {
          logger.warn('Invalid parentCoin in add price sync item', {
            coinId: coin.parentCoinId
          });
          return;
        }
        coinData = parentCoinData.tokenList[coin.coinId];
      } else {
        coinData = COINS[coinId];
      }

      if (!coinData) {
        logger.warn('Invalid coin in add price sync item', {
          coinId
        });
        return;
      }

      if (!coinData.isTest) {
        for (const days of [7, 30, 365] as Array<
          PriceSyncItemOptions['days']
        >) {
          if (days === 7 && coinData.coinGeckoId) continue;

          const oldPrices = await priceHistoryDb.getOne({
            coinId: coinData.id,
            interval: days
          });
          let addNew = true;

          // Check if the prices and old enough and then only add to sync
          if (oldPrices && oldPrices.data && oldPrices.data.length > 2) {
            const oldestPriceEntry = oldPrices.data[oldPrices.data.length - 1];
            const interval = (days === 30 ? 1 : 24) * 60 * 60 * 1000;
            const currentTime = new Date().getTime();
            const nextLatestTime = oldestPriceEntry[0] + interval;

            if (nextLatestTime > currentTime) {
              addNew = false;
            }
          }

          if (addNew) {
            const newItem = new PriceSyncItem({
              days,
              coinId: coinData.id,
              coinGroup: coinData.group,
              parentCoinId: coin.parentCoinId,
              id: coinData.coinGeckoId,
              isRefresh,
              module
            });
            addToQueue(newItem);
          }
        }
      }
    };

  const addLatestPriceSyncItemFromCoin: SyncProviderTypes['addLatestPriceSyncItemFromAccount'] =
    (coin, { module = 'default', isRefresh = false }) => {
      const coinId = coin.coinId;
      let coinData: AbsCoinData;

      if (coin.parentCoinId && coin.parentCoinId !== coin.coinId) {
        const parentCoinData = COINS[coin.parentCoinId];
        if (!parentCoinData) {
          logger.warn('Invalid parentCoin in add latest price sync item', {
            coinId: coin.parentCoinId
          });
          return;
        }
        coinData = parentCoinData.tokenList[coin.coinId];
      } else {
        coinData = COINS[coinId];
      }

      if (!coinData) {
        logger.warn('Invalid coin in add latest price sync item', {
          coinId
        });
        return;
      }

      if (!coinData.isTest) {
        const newItem = new LatestPriceSyncItem({
          coinId: coin.coinId,
          parentCoinId: coin.parentCoinId,
          coinGroup: coinData.group,
          id: coinData.coinGeckoId,
          isRefresh,
          module
        });
        addToQueue(newItem);
      }
    };

  const addHistoryRefresh = async ({
    isRefresh = false,
    module = 'refresh-history'
  }) => {
    const allXpubs = await accountDb.getAll();
    for (const xpub of allXpubs) {
      addHistorySyncItemFromCoin(xpub, { isRefresh, module });
    }
  };

  const addBalanceRefresh = async ({
    isRefresh = false,
    module = 'refresh-balance'
  }) => {
    const accounts = await accountDb.getAll();
    const tokens = await tokenDb.getAll();

    for (const account of accounts) {
      addBalanceSyncItemFromCoin(account, { isRefresh, module });
    }

    for (const token of tokens) {
      const ethXpub = await accountDb.getOne({
        accountId: token.accountId
      });
      if (!ethXpub) {
        logger.warn('EthCoin does not exist', { ethCoin: token.coin });
        return;
      }
      addToQueue(
        new BalanceSyncItem({
          accountId: ethXpub.accountId,
          accountType: ethXpub.accountType,
          coinId: token.coinId,
          xpub: ethXpub.xpub,
          walletId: token.walletId,
          parentCoinId: token.parentCoinId,
          coinGroup: CoinGroup.ERC20Tokens,
          module,
          isRefresh
        })
      );
    }
  };

  const addCustomAccountRefresh = async ({
    isRefresh = false,
    module = 'refresh-custom-acc'
  }) => {
    const coins = await accountDb.getAll({ coinId: NearCoinMap.near });
    for (const coin of coins) {
      addCustomAccountSyncItemFromCoin(coin, { isRefresh, module });
    }
  };

  const addPriceRefresh = async ({ isRefresh = false, module = 'default' }) => {
    const allXpubs = await accountDb.getAll();
    const tokens = await tokenDb.getAll();

    for (const xpub of allXpubs) {
      addPriceSyncItemFromCoin(xpub, { isRefresh, module });
    }

    for (const token of tokens) {
      addPriceSyncItemFromCoin(
        {
          coinId: token.coinId,
          parentCoinId: token.parentCoinId,
          coinGroup: CoinGroup.ERC20Tokens
        },
        {
          isRefresh,
          module
        }
      );
    }
  };

  const addLatestPriceRefresh = async ({
    isRefresh = false,
    module = 'refresh-latest-price'
  }) => {
    const allAccounts = await accountDb.getAll();
    const tokens = await tokenDb.getAll();

    for (const account of allAccounts) {
      addLatestPriceSyncItemFromCoin(account, { isRefresh, module });
    }

    for (const token of tokens) {
      addLatestPriceSyncItemFromCoin(
        {
          coinId: token.coinId,
          parentCoinId: token.parentCoinId,
          coinGroup: CoinGroup.ERC20Tokens
        },
        {
          isRefresh,
          module
        }
      );
    }
  };

  const addCoinTask = (coin: Account, { module = 'default' }) => {
    setHasCoin(true);
    // allow overlap of resync with flow specific resync
    addCustomAccountSyncItemFromCoin(coin, { module, isRefresh: true });
    addBalanceSyncItemFromCoin(coin, { module, isRefresh: true });
    addHistorySyncItemFromCoin(coin, { module, isRefresh: true });
    addPriceSyncItemFromCoin(coin, { module, isRefresh: true });
    addLatestPriceSyncItemFromCoin(coin, { module, isRefresh: true });
  };

  const setupInitial = async () => {
    const coinList = await accountDb.getOne({});
    const _hasCoin = !!coinList;
    prevHasCoin.current = _hasCoin;
    setHasCoin(_hasCoin);

    logger.info('Sync: Adding Initial items');
    if (process.env.IS_PRODUCTION === 'true') {
      await addCustomAccountRefresh({
        isRefresh: true,
        module: SyncModules.INITIAL_RESYNC
      });
      await addBalanceRefresh({
        isRefresh: true,
        module: SyncModules.INITIAL_RESYNC
      });
      await addHistoryRefresh({
        isRefresh: true,
        module: SyncModules.INITIAL_RESYNC
      });
      await addPriceRefresh({
        isRefresh: true,
        module: SyncModules.INITIAL_RESYNC
      });
      await addLatestPriceRefresh({
        isRefresh: true,
        module: SyncModules.INITIAL_RESYNC
      });
    }

    setInitialSetupDone(true);
  };

  const reSync = async () => {
    logger.info('Sync: ReSyncing items');
    const module = SyncModules.MANUAL_RESYNC;

    await addCustomAccountRefresh({ module });
    await addBalanceRefresh({ module });
    await addHistoryRefresh({ module });
    await addPriceRefresh({ module });
    await addLatestPriceRefresh({ module });
    await notifications.updateLatest();
  };

  const intervals = useRef<NodeJS.Timeout[]>([]);
  const syncTimeout = useRef<NodeJS.Timeout>();
  const isResyncExecuting = useRef(true);

  useEffect(() => {
    if (!isInitialSetupDone) return;

    if (process.env.IS_PRODUCTION !== 'true') {
      return;
    }

    logger.debug('Sync: Modules executing', { modulesInExecutionQueue });
    // resync: balances & transaction history
    const resyncKeys = [
      SyncModules.AUTO_RESYNC,
      SyncModules.MANUAL_RESYNC,
      SyncModules.INITIAL_RESYNC
    ];
    const isExecuting = resyncKeys.some(r =>
      modulesInExecutionQueue.includes(r)
    );

    // add the timed execution
    const setTimer = () => {
      syncTimeout.current = setTimeout(async () => {
        if (isResyncExecuting.current === true) {
          logger.info(
            "Sync: Refresh for latest balance and history skipped, because it's already running"
          );
          return;
        }

        logger.info('Sync: Refresh triggered for latest balance and history');
        addBalanceRefresh({ isRefresh: true, module: SyncModules.AUTO_RESYNC });
        addHistoryRefresh({ isRefresh: true, module: SyncModules.AUTO_RESYNC });
      }, RESYNC_INTERVAL);
    };

    if (isExecuting === true && isResyncExecuting.current === false) {
      // reset the timer for execution
      clearTimeout(syncTimeout.current);
    } else if (isExecuting === false && isResyncExecuting.current === true) {
      setTimer();
    } else if (hasCoin && !prevHasCoin.current) {
      // Trigger timer after we transition from having `0` coins to non zero coins
      setTimer();
      prevHasCoin.current = true;
    }

    isResyncExecuting.current = isExecuting;
  }, [modulesInExecutionQueue, isInitialSetupDone, hasCoin]);

  useEffect(() => {
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
          addPriceRefresh({ isRefresh: true, module: SyncModules.PRICE_RESYNC })
            .then(() => {
              logger.info('Sync: Price Refresh completed');
            })
            .catch(err => {
              logger.error(
                `${CysyncError.PRICE_REFRESH_FAILED} Sync: Price Refresh failed`
              );
              logger.error(err);
            });
          if (connectedRef) {
            notifications
              .updateLatest()
              .then(() => {
                logger.info('Sync: Notification Refresh completed');
              })
              .catch(err => {
                logger.error(
                  `${CysyncError.NOTIFICATIONS_REFRESH_FAILED} Sync: Notification Refresh failed`
                );
                logger.error(err);
              });
          }
          transactionDb
            .failExpiredTxn()
            .then(() => {
              logger.info('Sync: Transaction Refresh completed');
            })
            .catch(err => {
              logger.error(
                `${CysyncError.HISTORY_REFRESH_FAILED} Sync: Transaction Refresh failed`
              );
              logger.error(err);
            });
        }, 1000 * 60 * 60)
      );

      // Refresh after 15 mins
      intervals.current.push(
        setInterval(async () => {
          logger.info('Sync: Refresh triggered for latest price');
          try {
            addLatestPriceRefresh({
              isRefresh: true,
              module: SyncModules.LATEST_PRICE_RESYNC
            });
          } catch (error) {
            logger.error(
              `${CysyncError.LATEST_PRICE_REFRESH_FAILED} Sync: Error in refreshing latest price`
            );
            logger.error(error);
          }
          addCustomAccountRefresh({
            isRefresh: true,
            module: SyncModules.LATEST_PRICE_RESYNC
          })
            .then(() => {
              logger.info('Sync: Custom Accounts Refresh completed');
            })
            .catch(err => {
              logger.error('Sync: Custom Accounts Refresh failed', err);
            });
        }, 1000 * 60 * 15)
      );
    }
    return () => {
      intervals.current.forEach(interval => clearInterval(interval));
      intervals.current = [] as NodeJS.Timeout[];
    };
  }, []);

  return (
    <SyncContext.Provider
      value={{
        isSyncing,
        isWaitingForConnection,
        modulesInExecutionQueue,
        addCoinTask,
        reSync,
        addBalanceSyncItemFromCoin,
        addHistorySyncItemFromCoin,
        addCustomAccountSyncItemFromCoin
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
