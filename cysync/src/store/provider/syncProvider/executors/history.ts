import {
  BtcCoinData,
  COINS,
  ERC20TOKENS,
  EthCoinData
} from '@cypherock/communication';
import { Transaction, Xpub } from '@cypherock/database';
import {
  batch as batchServer,
  eth as ethServer,
  IRequestMetadata,
  v2 as v2Server
} from '@cypherock/server-wrapper';
import {
  formatEthAddress,
  generateEthAddressFromXpub,
  getEthAmountFromInput
} from '@cypherock/wallet';
import BigNumber from 'bignumber.js';

import logger from '../../../../utils/logger';
import {
  addressDb,
  erc20tokenDb,
  transactionDb,
  xpubDb
} from '../../../database';
import { BalanceSyncItem, HistorySyncItem, SyncProviderTypes } from '../types';

export const getRequestsMetadata = (
  item: HistorySyncItem
): IRequestMetadata[] => {
  const coin = COINS[item.coinType];

  if (!coin) {
    logger.warn('Invalid coin in sync queue', {
      coinType: item.coinType
    });
    return undefined;
  }

  if (coin instanceof BtcCoinData) {
    const metadata = v2Server
      .getTransaction(
        {
          xpub: item.zpub ? item.zpub : item.xpub,
          coinType: item.coinType,
          from: item.afterBlock,
          page: item.page || 1,
          limit: 100
        },
        item.isRefresh
      )
      .getMetadata();

    return [metadata];
  }

  if (coin instanceof EthCoinData) {
    const address = generateEthAddressFromXpub(item.xpub);

    const ethTxnMetadata = ethServer.transaction
      .getHistory({ address, network: coin.network }, item.isRefresh)
      .getMetadata();

    const erc20Metadata = ethServer.transaction
      .getContractHistory(
        {
          address,
          network: coin.network
        },
        item.isRefresh
      )
      .getMetadata();
    return [ethTxnMetadata, erc20Metadata];
  }

  logger.warn('Invalid coin in sync queue', {
    coinType: item.coinType
  });
  return [];
};

export const processResponses = async (
  item: HistorySyncItem,
  responses: batchServer.IBatchResponse[],
  options: {
    addToQueue: SyncProviderTypes['addToQueue'];
    addPriceSyncItemFromXpub: SyncProviderTypes['addPriceSyncItemFromXpub'];
    addLatestPriceSyncItemFromXpub: SyncProviderTypes['addLatestPriceSyncItemFromXpub'];
  }
): Promise<any> => {
  const coin = COINS[item.coinType];
  if (!coin) {
    logger.warn('Invalid coin in sync queue', {
      coinType: item.coinType
    });
    return undefined;
  }

  if (coin instanceof BtcCoinData) {
    if (responses.length <= 0) {
      throw new Error('Did not find responses while processing');
    }

    const response = responses[0];

    if (response.isFailed) {
      logger.error(response.data);
      throw new Error('Invalid response from server');
    }

    let balance = new BigNumber(response.data.balance);
    const unconfirmedBalance = new BigNumber(response.data.unconfirmedBalance);
    const xpub = await xpubDb.getByWalletIdandCoin(item.walletId, item.coinType);

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
            addressDB: addressDb,
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
    return undefined;
  }

  if (coin instanceof EthCoinData) {
    if (responses.length < 2) {
      throw new Error('Did not find responses while processing');
    }

    const history: Transaction[] = [];
    const erc20Tokens = new Set<string>();

    const address = generateEthAddressFromXpub(item.xpub);
    const rawHistory = responses[0].data?.result;

    const erc20history = responses[1].data?.result;

    if (!rawHistory) {
      throw new Error('Invalid eth history from server');
    }

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

    if (!erc20history) {
      throw new Error('Invalid erc20 history from server');
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
      const token = await erc20tokenDb.getOne({
        walletId: item.walletId,
        coin: tokenName.toLowerCase(),
        ethCoin: item.coinType
      });
      if (!token) {
        erc20tokenDb.insert({
          walletId: item.walletId,
          coin: tokenName.toLowerCase(),
          ethCoin: item.coinType,
          balance: '0'
        });
        options.addToQueue(
          new BalanceSyncItem({
            xpub: item.xpub,
            walletId: item.walletId,
            coinType: tokenName,
            ethCoin: item.coinType,
            module: item.module,
            isRefresh: true
          })
        );
        options.addPriceSyncItemFromXpub({ coin: tokenName } as Xpub, {
          isRefresh: true,
          module: item.module
        });
        options.addLatestPriceSyncItemFromXpub({ coin: tokenName } as Xpub, {
          isRefresh: true,
          module: 'default'
        });
      }
    }
  }
};
