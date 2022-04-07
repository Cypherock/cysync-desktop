import {
  ALLCOINS,
  BtcCoinData,
  COINS,
  Erc20CoinData,
  ERC20TOKENS,
  EthCoinData
} from '@cypherock/communication';
import { Transaction, Xpub } from '@cypherock/database';
import {
  eth as ethServer,
  pricing as pricingServer,
  v2 as v2Server
} from '@cypherock/server-wrapper';
import {
  formatEthAddress,
  generateEthAddressFromXpub,
  getEthAmountFromInput
} from '@cypherock/wallet';
import BigNumber from 'bignumber.js';
import crypto from 'crypto';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

import logger from '../../../utils/logger';
import {
  Databases,
  dbUtil,
  transactionDb,
  xpubDb,
  latestPriceDb
} from '../../database';
import { useNetwork } from '../networkProvider';
import { useNotifications } from '../notificationProvider';

import {
  BalanceSyncItem,
  HistorySyncItem,
  LatestPriceSyncItem,
  PriceSyncItem,
  PriceSyncItemOptions,
  SyncItem
} from './types';

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface SyncContextInterface {
  isSyncing: boolean;
  isWaitingForConnection: boolean;
  executingModule: string;
  executingType: string;
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

type SyncQueueItem =
  | HistorySyncItem
  | PriceSyncItem
  | BalanceSyncItem
  | LatestPriceSyncItem;

export const SyncContext: React.Context<SyncContextInterface> =
  React.createContext<SyncContextInterface>({} as SyncContextInterface);

export const SyncProvider: React.FC = ({ children }) => {
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isWaitingForConnection, setWaitingForConnection] =
    React.useState(false);
  const [isInitialSetupDone, setInitialSetupDone] = React.useState(false);
  const [isExecutingTask, setIsExecutingTask] = React.useState(false);
  const [executingModule, setExecutingModule] = React.useState('');
  const [executingType, setExecutingType] = React.useState('');
  const [modulesInExecutionQueue, setModuleInExecutionQueue] = React.useState<
    string[]
  >([]);
  const [syncQueue, setSyncQueue] = React.useState<SyncQueueItem[]>([]);
  const notifications = useNotifications();

  const queueExecuteInterval = 1000;
  const maxRetries = 2;

  const { connected } = useNetwork();

  const addToQueue = (item: SyncQueueItem) => {
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

  const addHistorySyncItemFromXpub = async (
    xpub: Xpub,
    { module = 'default', isRefresh = false }
  ) => {
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
          transactionHistory.length > 0 && transactionHistory[0].blockHeight > 0
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

  const addBalanceSyncItemFromXpub = (
    xpub: Xpub,
    {
      token,
      module = 'default',
      isRefresh = false
    }: {
      token?: string;
      module?: string;
      isRefresh?: boolean;
    }
  ) => {
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

  const addPriceSyncItemFromXpub = (
    xpub: Xpub,
    { module = 'default', isRefresh = false }
  ) => {
    const coinName = xpub.coin;

    const coin = ALLCOINS[coinName];

    if (!coin) {
      logger.warn('Invalid coin in add price sync item', {
        coinType: coinName
      });
      return;
    }

    if (!coin.isTest) {
      for (const days of [7, 30, 365] as Array<PriceSyncItemOptions['days']>) {
        const newItem = new PriceSyncItem({
          days,
          coinType: coin.abbr,
          isRefresh,
          module
        });
        addToQueue(newItem);
      }
    }
  };

  const addLatestPriceSyncItemFromXpub = (
    xpub: Xpub,
    { module = 'default', isRefresh = false }
  ) => {
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

  const executeHistoryItem = async (
    item: HistorySyncItem
  ): Promise<
    undefined | { after: number | undefined; page: number | undefined }
  > => {
    const coin = COINS[item.coinType];
    if (!coin) {
      logger.warn('Invalid coin in sync queue', {
        coinType: item.coinType
      });
      return undefined;
    }

    if (coin instanceof BtcCoinData) {
      const response = await v2Server.getTransaction(
        {
          xpub: item.zpub ? item.zpub : item.xpub,
          coinType: item.coinType,
          from: item.afterBlock,
          page: item.page || 1,
          limit: 100
        },
        item.isRefresh
      );

      let balance = new BigNumber(response.data.balance);
      const unconfirmedBalance = new BigNumber(
        response.data.unconfirmedBalance
      );
      const xpub = await xpubDb.getByWalletIdandCoin(
        item.walletId,
        item.coinType
      );

      if (!xpub) {
        logger.warn('Cannot find xpub while fetching txn', { item });
      } else {
        if (item.zpub) {
          await xpubDb.updateZpubBalance(item.xpub, item.coinType, {
            balance: balance.toString(),
            unconfirmedBalance: unconfirmedBalance.toString()
          });
          if (xpub.xpubBalance) {
            if (xpub.xpubBalance.balance) {
              balance = balance.plus(xpub.xpubBalance.balance);
            }
            if (xpub.xpubBalance.unconfirmedBalance) {
              balance = balance.plus(xpub.xpubBalance.unconfirmedBalance);
            }
          }
        } else {
          await xpubDb.updateBalance(item.xpub, item.coinType, {
            balance: balance.toString(),
            unconfirmedBalance: unconfirmedBalance.toString()
          });
          if (xpub.zpubBalance) {
            if (xpub.zpubBalance.balance) {
              balance = balance.plus(xpub.zpubBalance.balance);
            }
            if (xpub.zpubBalance.unconfirmedBalance) {
              balance = balance.plus(xpub.zpubBalance.unconfirmedBalance);
            }
          }
        }

        await xpubDb.updateTotalBalance(item.xpub, item.coinType, {
          balance: balance.toString(),
          unconfirmedBalance: unconfirmedBalance.toString()
        });
      }

      if (response.data.transactions) {
        for (const txn of response.data.transactions) {
          try {
            await transactionDb.insertFromBlockbookTxn({
              txn,
              xpub: item.xpub,
              addresses: response.data.tokens
                ? response.data.tokens.map((elem: any) => elem.name)
                : [],
              walletId: item.walletId,
              coinType: item.coinType,
              addressDbUtil: (...args: any) => {
                return dbUtil(Databases.ADDRESS, args[0], ...args.slice(1));
              },
              walletName: item.walletName
            });
            // No need to retry if the inserting fails because it'll produce the same error.
          } catch (error) {
            logger.error('Error while inserting transaction in DB');
            logger.error(error);
          }
        }

        // If there are more txs, return the last block height
        if (
          response.data.page &&
          response.data.totalPages &&
          response.data.totalPages > response.data.page
        ) {
          return {
            after: item.afterBlock ? item.afterBlock : undefined,
            page: response.data.page + 1
          };
        }
      }
    } else if (coin instanceof EthCoinData) {
      const history: Transaction[] = [];
      const erc20Tokens = new Set<string>();

      const address = generateEthAddressFromXpub(item.xpub);
      const rawHistory = (
        await ethServer.transaction.getHistory(
          { address, network: coin.network },
          item.isRefresh
        )
      ).data.result;

      const erc20history = (
        await ethServer.transaction.getContractHistory(
          {
            address,
            network: coin.network
          },
          item.isRefresh
        )
      ).data.result;

      for (const ele of rawHistory) {
        const fees = new BigNumber(ele.gasPrice || 0).multipliedBy(
          new BigNumber(ele.gasUsed || 0)
        );

        const fromAddr = formatEthAddress(ele.from);
        const toAddr = formatEthAddress(ele.to);

        const txn: Transaction = {
          hash: ele.hash,
          amount: String(ele.value),
          fees: fees.toString(),
          total: new BigNumber(ele.value).plus(fees).toString(),
          confirmations: ele.confirmations || 0,
          walletId: item.walletId,
          coin: item.coinType,
          // 2 for failed, 1 for pass
          status: ele.isError === '0' ? 1 : 2,
          sentReceive: address === fromAddr ? 'SENT' : 'RECEIVED',
          confirmed: new Date(parseInt(ele.timeStamp, 10) * 1000),
          blockHeight: ele.blockNumber,
          ethCoin: item.coinType,
          inputs: [
            {
              address: fromAddr,
              value: String(ele.value),
              index: 0,
              isMine: address === fromAddr
            }
          ],
          outputs: [
            {
              address: toAddr,
              value: String(ele.value),
              index: 0,
              isMine: address === toAddr
            }
          ]
        };

        // If it is a failed transaction, then check if it is a token transaction.
        if (txn.status === 2) {
          let amount = '0';
          const token = Object.values(ERC20TOKENS).find(
            t => t.address === ele.to.toLowerCase()
          );

          if (token) {
            if (ele.input) {
              amount = String(getEthAmountFromInput(ele.input));
            }

            txn.coin = token.abbr;
            txn.amount = amount;

            // Even if the token transaction failed, the transaction fee is still deducted.
            if (txn.sentReceive === 'SENT') {
              history.push({
                hash: ele.hash as string,
                amount: fees.toString(),
                fees: '0',
                total: fees.toString(),
                confirmations: (ele.confirmations as number) || 0,
                walletId: item.walletId,
                coin: item.coinType,
                status: 1,
                sentReceive: 'FEES',
                confirmed: new Date(parseInt(ele.timeStamp, 10) * 1000),
                blockHeight: ele.blockNumber as number,
                ethCoin: item.coinType
              });
            }
          }
        }

        history.push(txn);
      }

      for (const ele of erc20history) {
        const tokenObj = ERC20TOKENS[ele.tokenSymbol.toLowerCase()];
        const fromAddr = formatEthAddress(ele.from);
        const toAddr = formatEthAddress(ele.to);

        // Only add if it exists in our coin list
        if (
          tokenObj &&
          ele.contractAddress &&
          ele.contractAddress.toLowerCase() === tokenObj.address.toLowerCase()
        ) {
          const fees = new BigNumber(ele.gasPrice || 0).multipliedBy(
            new BigNumber(ele.gasUsed || 0)
          );

          erc20Tokens.add(ele.tokenSymbol.toLowerCase());
          const txn: Transaction = {
            hash: ele.hash as string,
            amount: String(ele.value),
            fees: fees.toString(),
            total: String(ele.value),
            confirmations: (ele.confirmations as number) || 0,
            walletId: item.walletId,
            coin: (ele.tokenSymbol as string).toLowerCase(),
            status: 1,
            sentReceive: address === fromAddr ? 'SENT' : 'RECEIVED',
            confirmed: new Date(parseInt(ele.timeStamp, 10) * 1000),
            blockHeight: ele.blockNumber as number,
            ethCoin: item.coinType,
            inputs: [
              {
                address: fromAddr,
                value: String(ele.value),
                index: 0,
                isMine: address === fromAddr
              }
            ],
            outputs: [
              {
                address: ele.to,
                value: String(ele.value),
                index: 0,
                isMine: address === toAddr
              }
            ]
          };

          history.push(txn);
        }

        // When a token is sent, the transaction fee is deducted from ETH
        if (address === fromAddr) {
          const amount = new BigNumber(ele.gasPrice || 0).multipliedBy(
            new BigNumber(ele.gasUsed || 0)
          );
          history.push({
            hash: ele.hash as string,
            amount: amount.toString(),
            fees: '0',
            total: amount.toString(),
            confirmations: (ele.confirmations as number) || 0,
            walletId: item.walletId,
            coin: item.coinType,
            status: 1,
            sentReceive: 'FEES',
            confirmed: new Date(parseInt(ele.timeStamp, 10) * 1000),
            blockHeight: ele.blockNumber as number,
            ethCoin: item.coinType
          });
        }
      }

      for (const txn of history) {
        try {
          await transactionDb.insert(txn);
          // No need to retry if the inserting fails because it'll produce the same error.
        } catch (error) {
          logger.error('Error while inserting transaction in DB');
          logger.error(error);
        }
      }

      for (const tokenName of erc20Tokens) {
        const token = await dbUtil(Databases.ERC20TOKEN, 'getOne', {
          walletId: item.walletId,
          coin: tokenName.toLowerCase(),
          ethCoin: item.coinType
        });
        if (!token) {
          dbUtil(Databases.ERC20TOKEN, 'insert', {
            walletId: item.walletId,
            coin: tokenName.toLowerCase(),
            ethCoin: item.coinType,
            balance: '0'
          });
          addToQueue(
            new BalanceSyncItem({
              xpub: item.xpub,
              walletId: item.walletId,
              coinType: tokenName,
              ethCoin: item.coinType,
              module: item.module,
              isRefresh: true
            })
          );
          addPriceSyncItemFromXpub({ coin: tokenName } as Xpub, {
            isRefresh: true,
            module: item.module
          });
        }
      }
    }

    return undefined;
  };

  const executePriceItem = async (item: PriceSyncItem) => {
    const res = await pricingServer.get({
      coin: item.coinType,
      days: item.days
    });
    await dbUtil(Databases.PRICE, 'insert', item.coinType, item.days, res.data.data.entries);
  };

  const executeLatestPriceItem = async (item: LatestPriceSyncItem) => {
    const res = await pricingServer.getLatest({
      coin: item.coinType
    });
    await latestPriceDb.insert(item.coinType, res.data.data.price);
  };

  const executeBalanceItem = async (item: BalanceSyncItem) => {
    const coin = ALLCOINS[item.coinType];
    if (!coin) {
      logger.warn('Invalid coin in sync queue', {
        coinType: item.coinType
      });
      return;
    }

    if (coin instanceof BtcCoinData) {
      logger.warn('Still using BTC fork balance API');
      let balance = new BigNumber(0);
      let unconfirmedBalance = new BigNumber(0);

      const balanceReq = await v2Server.getBalance({
        xpub: item.xpub,
        coinType: coin.abbr
      });

      balance = balance.plus(balanceReq.data.balance);
      unconfirmedBalance = unconfirmedBalance.plus(
        balanceReq.data.unconfirmedBalance
      );

      if (item.zpub) {
        const zBalanceReq = await v2Server.getBalance({
          xpub: item.zpub,
          coinType: coin.abbr
        });
        balance = balance.plus(zBalanceReq.data.balance);
        unconfirmedBalance = unconfirmedBalance.plus(
          zBalanceReq.data.unconfirmedBalance
        );
      }

      const bal = {
        balance: balance.toString(),
        unconfirmedBalance: unconfirmedBalance.toString()
      };

      await xpubDb.updateTotalBalance(item.xpub, item.coinType, bal);
    } else if (coin instanceof EthCoinData) {
      const address = generateEthAddressFromXpub(item.xpub);
      const balanceRes = await ethServer.wallet.getBalance(
        {
          address,
          network: coin.network
        },
        item.isRefresh
      );
      const balance = new BigNumber(balanceRes.data);

      await xpubDb.updateTotalBalance(item.xpub, item.coinType, {
        balance: balance.toString(),
        unconfirmedBalance: '0'
      });
    } else if (coin instanceof Erc20CoinData) {
      const address = generateEthAddressFromXpub(item.xpub);
      if (item.ethCoin) {
        const ethCoin = COINS[item.ethCoin];
        if (ethCoin instanceof EthCoinData) {
          const erc20address = coin.address;
          const balanceRes = await ethServer.wallet.getBalance(
            {
              address,
              network: ethCoin.network,
              contractAddress: erc20address
            },
            item.isRefresh
          );
          const balance = new BigNumber(balanceRes.data);
          await dbUtil(
            Databases.ERC20TOKEN,
            'updateBalance',
            item.coinType,
            item.walletId,
            balance.toString()
          );
        } else {
          logger.warn('Invalid type of ethCoin specified', { ethCoin });
        }
      } else {
        logger.warn('Token being added to invalid ethereum coin type', {
          item
        });
      }
    }
  };

  const executeNextInQueue = async () => {
    setIsExecutingTask(true);
    if (!connected) {
      await sleep(queueExecuteInterval);
      setIsExecutingTask(false);
      return;
    }

    let item: SyncQueueItem | undefined;
    if (syncQueue.length > 0) {
      [item] = syncQueue;
    }

    if (item) {
      let isError = false;
      let isRetry = false;
      // This is for HistorySyncItem pagination
      let nextItemBefore:
        | undefined
        | { after: number | undefined; page: number | undefined };

      if (item.module !== executingModule) {
        setExecutingModule(item.module);
      }

      if (item.type !== executingType) {
        setExecutingType(item.type);
      }

      try {
        if (item instanceof HistorySyncItem) {
          nextItemBefore = await executeHistoryItem(item);
        } else if (item instanceof BalanceSyncItem) {
          await executeBalanceItem(item);
        } else if (item instanceof PriceSyncItem) {
          await executePriceItem(item);
        } else {
          await executeLatestPriceItem(item);
        }
      } catch (error) {
        isError = true;
        // Retry logic here
        if (item.retries < maxRetries) {
          logger.warn('Sync: Error, retrying...', { item });
          item.retries += 1;
          isRetry = true;
        } else {
          logger.error('Sync: Error, max retries exceeded', { item });
          logger.error(error);
        }
      } finally {
        if (item !== undefined) {
          // Using callback for preventing race condition
          setSyncQueue(currentSyncQueue => {
            const duplicate = [...currentSyncQueue];
            const index = duplicate.findIndex(elem =>
              elem.equals(item as SyncItem)
            );

            if (index !== -1) {
              // If there is error and retries are left, just update the retry
              if (isError && isRetry) {
                duplicate[index].retries = (item as SyncItem).retries;
                // If there a next page for HistoryItem, just update the beforeBlock
              } else if (
                duplicate[index] instanceof HistorySyncItem &&
                nextItemBefore !== undefined
              ) {
                (duplicate[index] as HistorySyncItem).page =
                  nextItemBefore.page;
                (duplicate[index] as HistorySyncItem).afterBlock =
                  nextItemBefore.after;
                // Else the item has been completed (or max retries exceeded)
              } else {
                duplicate.splice(index, 1);

                // Remove module from ModuleInExecutionQueue
                const { module } = item as SyncItem;
                if (
                  duplicate.findIndex(elem => elem.module === module) === -1
                ) {
                  setModuleInExecutionQueue(currentModules => {
                    const duplicateModules = [...currentModules];
                    const i = duplicateModules.findIndex(
                      elem => elem === module
                    );

                    if (i !== -1) {
                      duplicateModules.splice(i, 1);
                    }

                    return duplicateModules;
                  });
                }
              }
            }

            return duplicate;
          });
        }
      }
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
    const tokens = await dbUtil(Databases.ERC20TOKEN, 'getAll');

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
    const tokens = await dbUtil(Databases.ERC20TOKEN, 'getAll');

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
    const tokens = await dbUtil(Databases.ERC20TOKEN, 'getAll');

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
        executingType,
        executingModule,
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
