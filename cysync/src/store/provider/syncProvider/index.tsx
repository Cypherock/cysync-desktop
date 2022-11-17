import {
  AbsCoinData,
  BtcCoinData,
  CoinGroup,
  COINS,
  EthCoinData,
  NearCoinData,
  SolanaCoinData
} from '@cypherock/communication';
import crypto from 'crypto';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

import { CysyncError } from '../../../errors';
import logger from '../../../utils/logger';
import {
  Coin,
  coinDb,
  customAccountDb,
  getTopBlock,
  getTopHash,
  priceHistoryDb,
  tokenDb,
  transactionDb
} from '../../database';
import { useNetwork } from '../networkProvider';
import { useNotifications } from '../notificationProvider';

import {
  executeBatch,
  executeLatestPriceBatch,
  ExecutionResult
} from './executors';
import {
  BalanceSyncItem,
  ClientTimeoutInterface,
  CustomAccountSyncItem,
  HistorySyncItem,
  LatestPriceSyncItem,
  ModifiedCoin,
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
  addCoinTask: (coin: ModifiedCoin, options: { module: string }) => void;
  addTokenTask: (
    walletId: string,
    tokenName: string,
    ethCoin: string
  ) => Promise<void>;
  reSync: () => void;
  addBalanceSyncItemFromCoin: (
    coin: ModifiedCoin,
    options: {
      token?: string;
      module?: string;
      isRefresh?: boolean;
      customAccount?: string;
    }
  ) => void;
  addHistorySyncItemFromCoin: (
    coin: ModifiedCoin,
    options: { module?: string; isRefresh?: boolean }
  ) => void;
  addCustomAccountSyncItemFromCoin: (
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

  const timeThreshold = 60000; // log every 1 minute
  const offsetTime = useRef(0);
  const startTime = useRef(0);
  const clientTimeout = useRef<ClientTimeoutInterface>({
    pause: false,
    tryAfter: 0
  });

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
          page: 1,
          coinGroup: CoinGroup.BitcoinForks
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
            page: 1,
            coinGroup: CoinGroup.BitcoinForks
          });
          addToQueue(newZItem);
        }
      } else if (coinData instanceof EthCoinData) {
        const topBlock = await getTopBlock(
          {
            walletId: coin.walletId,
            slug: coinData.abbr,
            coin: coinData.abbr
          },
          {
            excludeFailed: true,
            excludePending: true
          }
        );
        const topTokenBlock = await getTopBlock(
          {
            walletId: coin.walletId,
            slug: coinData.abbr,
            coin: 'eth'
          },
          {
            excludeFailed: true,
            excludePending: true
          }
        );
        const newItem = new HistorySyncItem({
          xpub: coin.xpub,
          walletName: '',
          walletId: coin.walletId,
          coinType: coinData.abbr,
          afterBlock: topBlock,
          afterTokenBlock: topTokenBlock,
          isRefresh,
          module,
          coinGroup: CoinGroup.Ethereum
        });
        addToQueue(newItem);
      } else if (coinData instanceof NearCoinData) {
        const customAccounts = await customAccountDb.getAll({
          coin: coin.slug,
          walletId: coin.walletId
        });
        for (const account of customAccounts) {
          const customAccount = account.name;

          const topBlock = await getTopBlock(
            {
              walletId: coin.walletId,
              slug: coinData.abbr,
              customIdentifier: customAccount
            },
            {}
          );

          const newItem = new HistorySyncItem({
            xpub: coin.xpub,
            walletName: '',
            walletId: coin.walletId,
            coinType: coinData.abbr,
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
            walletId: coin.walletId,
            slug: coinData.abbr,
            status: 1
          },
          {}
        );

        const newItem = new HistorySyncItem({
          xpub: coin.xpub,
          walletName: '',
          walletId: coin.walletId,
          coinType: coinData.abbr,
          afterHash: topHash,
          coinGroup: CoinGroup.Solana,
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
    async (coin: ModifiedCoin, { module = 'default', isRefresh = false }) => {
      const isToken = coin.coinGroup === CoinGroup.ERC20Tokens;

      // If a token txn, refresh eth as well as token balance
      if (isToken) {
        addToQueue(
          new BalanceSyncItem({
            xpub: coin.xpub,
            walletId: coin.walletId,
            coinType: coin.slug,
            parentCoin: coin.parentCoin,
            coinGroup: CoinGroup.ERC20Tokens,
            module,
            isRefresh
          })
        );
      }
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

      if (coinData.group === CoinGroup.Ethereum) {
        addToQueue(
          new BalanceSyncItem({
            xpub: coin.xpub,
            zpub: coin.zpub,
            walletId: coin.walletId,
            coinType: coin.slug,
            module,
            isRefresh,
            coinGroup: CoinGroup.Ethereum
          })
        );
      } else if (coinData.group === CoinGroup.Near) {
        const customAccounts = await customAccountDb.getAll({
          coin: coin.slug,
          walletId: coin.walletId
        });
        for (const account of customAccounts) {
          const customAccount = account.name;
          const newItem = new BalanceSyncItem({
            xpub: coin.xpub,
            zpub: coin.zpub,
            walletId: coin.walletId,
            coinType: coin.slug,
            isRefresh,
            coinGroup: CoinGroup.Near,
            module,
            customAccount
          });
          addToQueue(newItem);
        }
      } else if (coinData.group === CoinGroup.Solana) {
        const newItem = new BalanceSyncItem({
          xpub: coin.xpub,
          zpub: coin.zpub,
          walletId: coin.walletId,
          coinType: coin.slug,
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

  const addCustomAccountSyncItemFromCoin: SyncProviderTypes['addCustomAccountSyncItemFromCoin'] =
    async (coin: Coin, { module = 'default', isRefresh = false }) => {
      const coinData = COINS[coin.slug];

      if (!coinData) {
        logger.warn('Xpub with invalid coin found', {
          coinData,
          coinType: coin.slug
        });
        logger.debug(
          'Xpub with invalid coin found addCustomAccountSyncItemFromCoin',
          {
            coinData,
            coinType: coin.slug,
            coin
          }
        );
        return;
      }

      if (coinData.group === CoinGroup.Near) {
        const newItem = new CustomAccountSyncItem({
          xpub: coin.xpub,
          walletId: coin.walletId,
          coinType: coin.slug,
          isRefresh,
          module
        });
        addToQueue(newItem);
      }
    };

  const addPriceSyncItemFromCoin: SyncProviderTypes['addPriceSyncItemFromCoin'] =
    async (coin, { module = 'default', isRefresh = false }) => {
      const coinName = coin.slug;

      let coinData: AbsCoinData;

      if (coin.parentCoin) {
        const parentCoinData = COINS[coin.parentCoin];
        if (!parentCoinData) {
          logger.warn('Invalid parentCoin in add price sync item', {
            coinType: coin.parentCoin
          });
          return;
        }
        coinData = parentCoinData.tokenList[coin.slug];
      } else {
        coinData = COINS[coinName];
      }

      if (!coinData) {
        logger.warn('Invalid coin in add price sync item', {
          coinType: coinName
        });
        return;
      }

      if (!coinData.isTest) {
        for (const days of [7, 30, 365] as Array<
          PriceSyncItemOptions['days']
        >) {
          if (days === 7 && coinData.coinGeckoId) continue;

          const oldPrices = await priceHistoryDb.getOne({
            slug: coinData.abbr,
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
              coinType: coinData.abbr,
              coinGroup: coinData.group,
              parentCoin: coin.parentCoin,
              id: coinData.coinGeckoId,
              isRefresh,
              module
            });
            addToQueue(newItem);
          }
        }
      }
    };

  const addLatestPriceSyncItemFromCoin: SyncProviderTypes['addLatestPriceSyncItemFromCoin'] =
    (coin, { module = 'default', isRefresh = false }) => {
      const coinName = coin.slug;
      let coinData: AbsCoinData;

      if (coin.parentCoin) {
        const parentCoinData = COINS[coin.parentCoin];
        if (!parentCoinData) {
          logger.warn('Invalid parentCoin in add latest price sync item', {
            coinType: coin.parentCoin
          });
          return;
        }
        coinData = parentCoinData.tokenList[coin.slug];
      } else {
        coinData = COINS[coinName];
      }

      if (!coinData) {
        logger.warn('Invalid coin in add latest price sync item', {
          coinType: coinName
        });
        return;
      }

      if (!coinData.isTest) {
        const newItem = new LatestPriceSyncItem({
          coinType: coinData.abbr,
          parentCoin: coin.parentCoin,
          coinGroup: coinData.group,
          id: coinData.coinGeckoId,
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
          logger.error({ error: errorMsg, item });
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

  const executeNextClientItemInQueue = async () => {
    if (!connected) {
      return [];
    }

    const latestPriceItems = syncQueue.filter(
      item => item.type === 'latestPrice'
    );

    const items = syncQueue.filter(item => item.type === 'price').splice(0, 1);

    try {
      if (clientTimeout.current.pause) {
        if (performance.now() >= clientTimeout.current.tryAfter) {
          clientTimeout.current = { pause: false, tryAfter: 0 };
          logger.info('Waiting complete');
        } else {
          return [];
        }
      }
      let latestPriceResult: ExecutionResult[] = [];
      if (latestPriceItems.length > 0) {
        latestPriceResult = await executeLatestPriceBatch(
          latestPriceItems as LatestPriceSyncItem[],
          {
            addToQueue,
            addPriceSyncItemFromCoin,
            addLatestPriceSyncItemFromCoin
          }
        );
      }
      const executionResult = await executeBatch(items, {
        addToQueue,
        addPriceSyncItemFromCoin,
        addLatestPriceSyncItemFromCoin,
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

    if (syncQueue.length > 0) {
      items = syncQueue
        .filter(item => item.type !== 'price' && item.type !== 'latestPrice')
        .slice(0, BATCH_SIZE);
    }

    if (items.length <= 0) {
      return [];
    }

    try {
      const executionResult = await executeBatch(items, {
        addToQueue,
        addPriceSyncItemFromCoin,
        addLatestPriceSyncItemFromCoin
      });
      return executionResult;
    } catch (error) {
      // Since all the tasks for an item are closely related, I understand why this is being done.
      // TODO: But we should aim to do better to handle a single failing.
      logger.error('Failed to execute batch, hence failing all tasks');
    }
  };

  const executeNextInQueue = async () => {
    setIsExecutingTask(true);
    const timeStart = performance.now();
    const array = await Promise.all([
      executeNextClientItemInQueue(),
      executeNextBatchItemInQueue()
    ]);
    updateAllExecutedItems(array.reduce((acc, item) => acc.concat(item), []));
    const timeStop = performance.now();
    if (timeStop - timeStart > 5000) {
      logger.info(`Batch execution took ${timeStop - timeStart} milliseconds`);
      logger.info({
        queue: array
          .reduce((acc, item) => acc.concat(item), [])
          .map(item => {
            return {
              ...item,
              item: {
                ...item.item,
                walletId: undefined,
                xpub: undefined,
                zpub: undefined
              }
            };
          })
      });
    }
    await sleep(queueExecuteInterval);
    setIsExecutingTask(false);
  };

  const addHistoryRefresh = async ({
    isRefresh = false,
    module = 'refresh-history'
  }) => {
    const allXpubs = await coinDb.getAll();
    for (const xpub of allXpubs) {
      addHistorySyncItemFromCoin(xpub, { isRefresh, module });
    }
  };

  const addBalanceRefresh = async ({
    isRefresh = false,
    module = 'refresh-balance'
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
          coinType: token.slug,
          parentCoin: token.coin,
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
    const coins = await coinDb.getAll({ slug: 'near' });
    for (const coin of coins) {
      addCustomAccountSyncItemFromCoin(coin, { isRefresh, module });
    }
  };

  const addPriceRefresh = async ({ isRefresh = false, module = 'default' }) => {
    const allXpubs = await coinDb.getAll();
    const tokens = await tokenDb.getAll();

    for (const xpub of allXpubs) {
      addPriceSyncItemFromCoin(xpub, { isRefresh, module });
    }

    for (const token of tokens) {
      addPriceSyncItemFromCoin(
        {
          slug: token.slug,
          coinGroup: CoinGroup.ERC20Tokens,
          parentCoin: token.coin
        } as ModifiedCoin,
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
    const allXpubs = await coinDb.getAll();
    const tokens = await tokenDb.getAll();

    for (const xpub of allXpubs) {
      addLatestPriceSyncItemFromCoin(xpub, { isRefresh, module });
    }

    for (const token of tokens) {
      addLatestPriceSyncItemFromCoin(
        {
          slug: token.slug,
          parentCoin: token.coin,
          coinGroup: CoinGroup.ERC20Tokens
        } as ModifiedCoin,
        {
          isRefresh,
          module
        }
      );
    }
  };

  const addCoinTask = (coin: Coin, { module = 'default' }) => {
    // allow overlap of resync with flow specific resync
    addCustomAccountSyncItemFromCoin(coin, { module, isRefresh: true });
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
        parentCoin: ethCoin,
        coinGroup: CoinGroup.ERC20Tokens,
        module: 'default',
        isRefresh: true
      })
    );
    addPriceSyncItemFromCoin(
      {
        slug: tokenName,
        parentCoin: ethCoin,
        coinGroup: CoinGroup.ERC20Tokens
      } as ModifiedCoin,
      {
        isRefresh: true,
        module: 'default'
      }
    );
    addLatestPriceSyncItemFromCoin(
      {
        slug: tokenName,
        parentCoin: ethCoin,
        coinGroup: CoinGroup.ERC20Tokens
      } as ModifiedCoin,
      {
        isRefresh: true,
        module: 'default'
      }
    );
  };

  const setupInitial = async () => {
    logger.info('Sync: Adding Initial items');
    if (process.env.IS_PRODUCTION === 'true') {
      await addCustomAccountRefresh({ isRefresh: true });
      await addBalanceRefresh({ isRefresh: true });
      await addHistoryRefresh({ isRefresh: true });
      await addPriceRefresh({ isRefresh: true });
      await addLatestPriceRefresh({ isRefresh: true });
    }

    setInitialSetupDone(true);
  };

  const reSync = async () => {
    logger.info('Sync: ReSyncing items');

    await addCustomAccountRefresh({});
    await addBalanceRefresh({});
    await addHistoryRefresh({});
    await addPriceRefresh({});
    await addLatestPriceRefresh({});
    await notifications.updateLatest();
  };

  const intervals = useRef<NodeJS.Timeout[]>([]);
  const syncTimeout = useRef<NodeJS.Timeout>();
  const isResyncExecuting = useRef(false);

  useEffect(() => {
    // resync: balances & transaction history
    const resyncKeys = ['refresh-balance', 'refresh-history'];
    const isExecuting = resyncKeys.some(r =>
      modulesInExecutionQueue.includes(r)
    );

    if (isExecuting === true && isResyncExecuting.current === false) {
      // reset the timer for execution
      clearTimeout(syncTimeout.current);
    } else if (isExecuting === false && isResyncExecuting.current === true) {
      // add the timed execution
      syncTimeout.current = setTimeout(async () => {
        if (isResyncExecuting.current === true) return;
        logger.info('Sync: Refresh triggered for latest balance and history');
        addBalanceRefresh({ isRefresh: true });
        addHistoryRefresh({ isRefresh: true });
      }, 1000 * 60 * 5);
    }

    isResyncExecuting.current = isExecuting;
  }, [modulesInExecutionQueue]);

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
            addLatestPriceRefresh({ isRefresh: true });
          } catch (error) {
            logger.error(
              `${CysyncError.LATEST_PRICE_REFRESH_FAILED} Sync: Error in refreshing latest price`
            );
            logger.error(error);
          }
          addCustomAccountRefresh({ isRefresh: true })
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

  useEffect(() => {
    if (syncQueue.length > 0) {
      if (startTime.current > 0) {
        const peek = performance.now();
        if (peek - startTime.current > timeThreshold + offsetTime.current) {
          offsetTime.current = peek;
          logger.info(`Threshold exceeded at ${peek} milliseconds`);
          logger.info({
            queue: syncQueue.slice(0, 3).map(item => {
              return {
                ...item,
                walletId: undefined,
                xpub: undefined,
                zpub: undefined
              };
            }),
            totalLength: syncQueue.length
          });
        }
      } else {
        startTime.current = performance.now();
        logger.info(
          `Sync queue started executing with ${syncQueue.length} items`
        );
      }
    } else {
      if (startTime.current > 0) {
        const stop = performance.now();
        logger.info(
          `Sync completed total time: ${stop - startTime.current} milliseconds`
        );
        offsetTime.current = 0;
        startTime.current = 0;
      }
    }
  }, [syncQueue]);

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
