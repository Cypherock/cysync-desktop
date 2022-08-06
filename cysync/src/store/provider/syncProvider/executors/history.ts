import {
  BtcCoinData,
  CoinGroup,
  COINS,
  EthCoinData,
  NearCoinData
} from '@cypherock/communication';
import {
  batch as batchServer,
  eth as ethServer,
  IRequestMetadata,
  near as nearServer,
  v2 as v2Server
} from '@cypherock/server-wrapper';
import {
  formatEthAddress,
  generateEthAddressFromXpub,
  getEthAmountFromInput
} from '@cypherock/wallet';
import BigNumber from 'bignumber.js';

import { CysyncError } from '../../../../errors';
import logger from '../../../../utils/logger';
import {
  addressDb,
  Coin,
  coinDb,
  IOtype,
  prepareFromBlockbookTxn,
  SentReceive,
  tokenDb,
  Transaction,
  transactionDb
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

  if (coin instanceof NearCoinData) {
    const nearTxnMetadata = nearServer.transaction
      .getHistory(
        {
          address: item.customAccount,
          network: coin.network,
          limit: 100,
          from: item.afterBlock
        },
        item.isRefresh
      )
      .getMetadata();

    return [nearTxnMetadata];
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
    addPriceSyncItemFromCoin: SyncProviderTypes['addPriceSyncItemFromCoin'];
    addLatestPriceSyncItemFromCoin: SyncProviderTypes['addLatestPriceSyncItemFromCoin'];
  }
): Promise<any> => {
  const coinData = COINS[item.coinType];
  if (!coinData) {
    logger.warn('Invalid coin in sync queue', {
      coinType: item.coinType
    });
    return undefined;
  }

  if (coinData instanceof BtcCoinData) {
    if (responses.length <= 0) {
      throw new Error('Did not find responses while processing');
    }

    const response = responses[0];

    if (response.isFailed) {
      const errorMessage = `${CysyncError.TXN_INVALID_RESPONSE} Invalid response from server`;
      logger.error(errorMessage);
      logger.error(response.data);
      throw new Error(errorMessage);
    }

    let balance = new BigNumber(response.data.balance);
    const unconfirmedBalance = new BigNumber(response.data.unconfirmedBalance);
    const coin = await coinDb.getOne({
      walletId: item.walletId,
      slug: item.coinType
    });

    if (!coin) {
      logger.warn('Cannot find xpub while fetching txn', { item });
    } else {
      if (item.zpub) {
        await coinDb.updateZpubBalance({
          zpub: item.zpub,
          slug: item.coinType,
          zpubBalance: balance.toString(),
          zpubUnconfirmedBalance: unconfirmedBalance.toString()
        });
        if (coin.xpubBalance) {
          balance = balance.plus(coin.xpubBalance);
        }
        if (coin.xpubUnconfirmedBalance) {
          balance = balance.plus(coin.xpubUnconfirmedBalance);
        }
      } else {
        await coinDb.updateXpubBalance({
          xpub: item.xpub,
          slug: item.coinType,
          xpubBalance: balance.toString(),
          xpubUnconfirmedBalance: unconfirmedBalance.toString()
        });

        if (coin.zpubBalance) {
          balance = balance.plus(coin.zpubBalance);
        }
        if (coin.zpubUnconfirmedBalance) {
          balance = balance.plus(coin.zpubUnconfirmedBalance);
        }
      }

      await coinDb.updateTotalBalance({
        xpub: item.xpub,
        slug: item.coinType,
        totalBalance: balance.toString(),
        totalUnconfirmedBalance: unconfirmedBalance.toString()
      });
    }

    const transactionDbList: Transaction[] = [];

    if (response.data.transactions) {
      for (const txn of response.data.transactions) {
        const newTxns = await prepareFromBlockbookTxn({
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
        newTxns.forEach(newTxn => transactionDbList.push(newTxn));
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
    try {
      await transactionDb.insertMany(transactionDbList);
    } catch (error) {
      // No need to retry if the inserting fails because it'll produce the same error.
      logger.error(
        `${CysyncError.TXN_INSERT_FAILED} Error while inserting transaction in DB : prepareFromBlockbookTxn`
      );
      logger.error(error);
    }
    return undefined;
  }

  if (coinData instanceof EthCoinData) {
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
        slug: item.coinType,
        // 2 for failed, 1 for pass
        status: ele.isError === '0' ? 1 : 2,
        sentReceive:
          address === fromAddr ? SentReceive.SENT : SentReceive.RECEIVED,
        confirmed: new Date(parseInt(ele.timeStamp, 10) * 1000),
        blockHeight: ele.blockNumber,
        coin: item.coinType,
        inputs: [
          {
            address: fromAddr,
            value: String(ele.value),
            indexNumber: 0,
            isMine: address === fromAddr,
            type: IOtype.INPUT
          }
        ],
        outputs: [
          {
            address: toAddr,
            value: String(ele.value),
            indexNumber: 0,
            isMine: address === toAddr,
            type: IOtype.OUTPUT
          }
        ]
      };

      // If it is a failed transaction, then check if it is a token transaction.
      if (txn.status === 2) {
        let amount = '0';
        const token = Object.values(coinData.tokenList).find(
          t => t.address === ele.to.toLowerCase()
        );

        if (token) {
          if (ele.input) {
            amount = String(getEthAmountFromInput(ele.input));
          }

          txn.slug = token.abbr;
          txn.amount = amount;

          // Even if the token transaction failed, the transaction fee is still deducted.
          if (txn.sentReceive === SentReceive.SENT) {
            history.push({
              hash: ele.hash as string,
              amount: fees.toString(),
              fees: '0',
              total: fees.toString(),
              confirmations: (ele.confirmations as number) || 0,
              walletId: item.walletId,
              slug: item.coinType,
              status: 1,
              sentReceive: SentReceive.FEES,
              confirmed: new Date(parseInt(ele.timeStamp, 10) * 1000),
              blockHeight: ele.blockNumber as number,
              coin: item.coinType
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
      const tokenObj = coinData.tokenList[ele.tokenSymbol.toLowerCase()];
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
          slug: (ele.tokenSymbol as string).toLowerCase(),
          status: 1,
          sentReceive:
            address === fromAddr ? SentReceive.SENT : SentReceive.RECEIVED,
          confirmed: new Date(parseInt(ele.timeStamp, 10) * 1000),
          blockHeight: ele.blockNumber as number,
          coin: item.coinType,
          inputs: [
            {
              address: fromAddr,
              value: String(ele.value),
              indexNumber: 0,
              isMine: address === fromAddr,
              type: IOtype.INPUT
            }
          ],
          outputs: [
            {
              address: ele.to,
              value: String(ele.value),
              indexNumber: 0,
              isMine: address === toAddr,
              type: IOtype.OUTPUT
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
          slug: item.coinType,
          status: 1,
          sentReceive: SentReceive.FEES,
          confirmed: new Date(parseInt(ele.timeStamp, 10) * 1000),
          blockHeight: ele.blockNumber as number,
          coin: item.coinType
        });
      }
    }

    const transactionDbList = [];
    for (const txn of history) {
      transactionDbList.push(txn);
    }
    try {
      await transactionDb.insertMany(transactionDbList);
      // No need to retry if the inserting fails because it'll produce the same error.
    } catch (error) {
      logger.error(
        ` ${CysyncError.TXN_INSERT_FAILED} Error while inserting transaction in DB : insert`
      );
      logger.error(error);
    }

    for (const tokenName of erc20Tokens) {
      const token = await tokenDb.getOne({
        walletId: item.walletId,
        slug: tokenName.toLowerCase(),
        coin: item.coinType
      });
      if (!token) {
        tokenDb.insert({
          walletId: item.walletId,
          slug: tokenName.toLowerCase(),
          coin: item.coinType,
          balance: '0',
          price: 0
        });
        options.addToQueue(
          new BalanceSyncItem({
            xpub: item.xpub,
            walletId: item.walletId,
            coinType: tokenName,
            parentCoin: item.coinType,
            coinGroup: CoinGroup.ERC20Tokens,
            module: item.module,
            isRefresh: true
          })
        );
        options.addPriceSyncItemFromCoin({ slug: tokenName } as Coin, {
          isRefresh: true,
          module: item.module
        });
        options.addLatestPriceSyncItemFromCoin({ slug: tokenName } as Coin, {
          isRefresh: true,
          module: 'default'
        });
      }
    }
  }

  if (coinData instanceof NearCoinData) {
    if (responses[0].isFailed) {
      throw new Error('Did not find responses while processing');
    }
    const history: Transaction[] = [];
    const rawHistory = responses[0].data.data;
    const more = responses[0].data.more;

    if (!rawHistory) {
      throw new Error('Invalid near history from server');
    }

    for (const ele of rawHistory) {
      const fees = new BigNumber(ele.tokens_burnt).plus(
        ele.receipt_conversion_tokens_burnt
      );

      const fromAddr = ele.signer_account_id;
      const toAddr = ele.receiver_account_id;
      const address = ele.address_parameter;

      const txn: Transaction = {
        hash: ele.transaction_hash,
        amount: String(ele.args.deposit),
        fees: fees.toString(),
        total: new BigNumber(ele.args.deposit).plus(fees).toString(),
        confirmations: 0,
        walletId: item.walletId,
        slug: item.coinType,
        status: ele.status ? 1 : 2,
        sentReceive:
          address === fromAddr ? SentReceive.SENT : SentReceive.RECEIVED,
        confirmed: new Date(parseInt(ele.block_timestamp, 10) / 1000000), //conversion from timestamp in nanoseconds
        blockHeight: parseInt(ele.block_height, 10) || 0,
        coin: item.coinType,
        inputs: [
          {
            address: fromAddr,
            value: String(ele.args.deposit),
            indexNumber: 0,
            isMine: address === fromAddr,
            type: IOtype.INPUT
          }
        ],
        outputs: [
          {
            address: toAddr,
            value: String(ele.args.deposit),
            indexNumber: 0,
            isMine: address === toAddr,
            type: IOtype.OUTPUT
          }
        ]
      };
      history.push(txn);
    }

    const transactionDbList = [];
    for (const txn of history) {
      transactionDbList.push(txn);
    }
    try {
      await transactionDb.insertMany(transactionDbList);
      // No need to retry if the inserting fails because it'll produce the same error.
    } catch (error) {
      logger.error(
        ` ${CysyncError.TXN_INSERT_FAILED} Error while inserting transaction in DB : insert`
      );
      logger.error(error);
    }
    if (more && rawHistory) {
      return {
        after: rawHistory[rawHistory.length - 1].block_height
      };
    }
  }
};
