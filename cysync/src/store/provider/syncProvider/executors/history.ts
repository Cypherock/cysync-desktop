import {
  BtcCoinData,
  CoinGroup,
  COINS,
  EthCoinData,
  NearCoinData,
  SolanaCoinData
} from '@cypherock/communication';
import {
  eth as ethServer,
  IRequestMetadata,
  near as nearServer,
  serverBatch as batchServer,
  solana as solanaServer,
  v2 as v2Server
} from '@cypherock/server-wrapper';
import {
  formatEthAddress,
  generateEthAddressFromXpub,
  generateSolanaAddressFromXpub,
  getEthAmountFromInput
} from '@cypherock/wallet';
import BigNumber from 'bignumber.js';

import { CysyncError } from '../../../../errors';
import logger from '../../../../utils/logger';
import {
  accountDb,
  addressDb,
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
  const coin = COINS[item.coinId];

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
          xpub: item.xpub,
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
    const address = generateEthAddressFromXpub(item.xpub, item.coinType);

    const ethTxnMetadata = ethServer.transaction
      .getHistory(
        {
          address,
          network: coin.network,
          limit: 100,
          from: item.afterBlock,
          responseType: 'v2'
        },
        item.isRefresh
      )
      .getMetadata();

    const erc20Metadata = ethServer.transaction
      .getContractHistory(
        {
          address,
          network: coin.network,
          limit: 100,
          from: item.afterTokenBlock,
          responseType: 'v2'
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
          from: item.afterBlock,
          responseType: 'v2'
        },
        item.isRefresh
      )
      .getMetadata();

    return [nearTxnMetadata];
  }

  if (coin instanceof SolanaCoinData) {
    const address = generateSolanaAddressFromXpub(item.xpub);

    const solanaTxnMetadata = solanaServer.transaction
      .getHistory(
        {
          address,
          network: coin.network,
          limit: 100,
          from: item.afterHash,
          before: item.beforeHash
        },
        item.isRefresh
      )
      .getMetadata();

    return [solanaTxnMetadata];
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
    addPriceSyncItemFromAccount: SyncProviderTypes['addPriceSyncItemFromAccount'];
    addLatestPriceSyncItemFromAccount: SyncProviderTypes['addLatestPriceSyncItemFromAccount'];
  }
): Promise<any> => {
  const coinData = COINS[item.coinId];
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

    const balance = new BigNumber(response.data.balance);
    const unconfirmedBalance = new BigNumber(response.data.unconfirmedBalance);
    const coin = await accountDb.getOne({
      accountId: item.accountId
    });

    if (!coin) {
      logger.warn('Cannot find xpub while fetching txn', { item });
    } else {
      await accountDb.updateBalance({
        accountId: item.accountId,
        totalBalance: balance.toString(),
        totalUnconfirmedBalance: unconfirmedBalance.toString()
      });
    }

    const transactionDbList: Transaction[] = [];

    if (response.data.transactions) {
      for (const txn of response.data.transactions) {
        const newTxns = await prepareFromBlockbookTxn({
          txn,
          accountId: item.accountId,
          coinId: item.coinId,
          parentCoinId: item.coinId,
          xpub: item.xpub,
          addresses: response.data.tokens
            ? response.data.tokens.map((elem: any) => elem.name)
            : [],
          walletId: item.walletId,
          coinType: item.coinType,
          addressDB: addressDb
        });
        newTxns.forEach(newTxn => transactionDbList.push(newTxn));
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

  if (coinData instanceof EthCoinData) {
    if (responses.length < 2) {
      throw new Error('Did not find responses while processing');
    }

    const history: Transaction[] = [];
    const erc20Tokens = new Set<string>();

    const address = generateEthAddressFromXpub(
      item.xpub,
      item.coinType
    ).toLowerCase();
    const rawHistory = responses[0].data?.result;
    const moreParent = responses[0].data?.more;

    const erc20history = responses[1].data?.result;
    const moreToken = responses[1].data?.more;

    if (!rawHistory) {
      throw new Error('Invalid eth history from server');
    }

    for (const ele of rawHistory) {
      const fees = new BigNumber(ele.gasPrice || 0).multipliedBy(
        new BigNumber(ele.gasUsed || 0)
      );

      const fromAddr = ele.from.toLowerCase();
      const toAddr = ele.to.toLowerCase();
      const selfTransfer = fromAddr === toAddr;
      const amount = String(ele.value || 0);

      const txn: Transaction = {
        accountId: item.accountId,
        coinId: item.coinId,
        parentCoinId: item.coinId,
        isSub: false,
        hash: ele.hash,
        amount: selfTransfer ? '0' : amount,
        fees: fees.toString(),
        total: new BigNumber(amount).plus(fees).toString(),
        confirmations: ele.confirmations || 0,
        walletId: item.walletId,
        slug: item.coinType,
        // 2 for failed, 1 for pass
        status: ele.isError === '0' ? 1 : 2,
        sentReceive:
          address === fromAddr ? SentReceive.SENT : SentReceive.RECEIVED,
        confirmed: new Date(parseInt(ele.timeStamp, 10) * 1000).toISOString(),
        blockHeight: ele.blockNumber,
        coin: item.coinType,
        inputs: [
          {
            address: fromAddr,
            value: amount,
            indexNumber: 0,
            isMine: address === fromAddr,
            type: IOtype.INPUT
          }
        ],
        outputs: [
          {
            address: toAddr,
            value: amount,
            indexNumber: 0,
            isMine: address === toAddr,
            type: IOtype.OUTPUT
          }
        ]
      };

      // If it is a failed transaction, then check if it is a token transaction.
      if (txn.status === 2) {
        let txnAmount = '0';
        const token = Object.values(coinData.tokenList).find(
          t => t.address === ele.to.toLowerCase()
        );

        if (token) {
          if (ele.input) {
            txnAmount = String(getEthAmountFromInput(ele.input));
          }

          txn.slug = token.abbr;
          txn.amount = txnAmount;

          // Even if the token transaction failed, the transaction fee is still deducted.
          if (txn.sentReceive === SentReceive.SENT) {
            history.push({
              accountId: item.accountId,
              coinId: item.coinId,
              parentCoinId: item.coinId,
              isSub: false,
              hash: ele.hash as string,
              amount: fees.toString(),
              fees: '0',
              total: fees.toString(),
              confirmations: (ele.confirmations as number) || 0,
              walletId: item.walletId,
              slug: item.coinType,
              status: 1,
              sentReceive: SentReceive.FEES,
              confirmed: new Date(
                parseInt(ele.timeStamp, 10) * 1000
              ).toISOString(),
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
      const tokenObj = Object.values(coinData.tokenList).find(
        e => ele.tokenSymbol.toLowerCase() === e.abbr
      );
      const fromAddr = formatEthAddress(ele.from).toLowerCase();
      const toAddr = formatEthAddress(ele.to).toLowerCase();
      const selfTransfer = fromAddr === toAddr;
      const amount = String(ele.value || 0);

      // Only add if it exists in our coin list
      if (
        tokenObj &&
        ele.contractAddress &&
        ele.contractAddress.toLowerCase() === tokenObj.address.toLowerCase()
      ) {
        const fees = new BigNumber(ele.gasPrice || 0).multipliedBy(
          new BigNumber(ele.gasUsed || 0)
        );

        erc20Tokens.add(tokenObj.id);
        const txn: Transaction = {
          accountId: item.accountId,
          coinId: tokenObj.id,
          parentCoinId: item.coinId,
          isSub: true,
          hash: ele.hash as string,
          amount: selfTransfer ? '0' : amount,
          fees: fees.toString(),
          total: amount,
          confirmations: (ele.confirmations as number) || 0,
          walletId: item.walletId,
          slug: (ele.tokenSymbol as string).toLowerCase(),
          status: 1,
          sentReceive:
            address === fromAddr ? SentReceive.SENT : SentReceive.RECEIVED,
          confirmed: new Date(parseInt(ele.timeStamp, 10) * 1000).toISOString(),
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
        const amt = new BigNumber(ele.gasPrice || 0).multipliedBy(
          new BigNumber(ele.gasUsed || 0)
        );
        history.push({
          accountId: item.accountId,
          coinId: item.coinId,
          parentCoinId: item.coinId,
          isSub: false,
          hash: ele.hash as string,
          amount: amt.toString(),
          fees: '0',
          total: amt.toString(),
          confirmations: (ele.confirmations as number) || 0,
          walletId: item.walletId,
          slug: item.coinType,
          status: 1,
          sentReceive: SentReceive.FEES,
          confirmed: new Date(parseInt(ele.timeStamp, 10) * 1000).toISOString(),
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

    for (const tokenId of erc20Tokens) {
      const tokenObj = coinData.tokenList[tokenId];
      const token = await tokenDb.getOne({
        walletId: item.walletId,
        slug: tokenId.toLowerCase(),
        coin: item.coinType
      });
      if (!token) {
        tokenDb.insert({
          accountId: item.accountId,
          parentCoinId: item.coinId,
          coinId: tokenObj.id,
          walletId: item.walletId,
          slug: tokenObj.abbr,
          coin: item.coinType,
          balance: '0'
        });
        options.addToQueue(
          new BalanceSyncItem({
            accountId: item.accountId,
            accountType: item.accountType,
            coinId: tokenObj.id,
            parentCoinId: item.coinId,
            xpub: item.xpub,
            walletId: item.walletId,
            coinType: tokenId,
            coinGroup: CoinGroup.ERC20Tokens,
            module: item.module,
            isRefresh: true
          })
        );
        options.addPriceSyncItemFromAccount(
          {
            ...item,
            slug: tokenObj.abbr,
            coinId: tokenObj.id,
            parentCoinId: item.coinId
          },
          {
            isRefresh: true,
            module: item.module
          }
        );
        options.addLatestPriceSyncItemFromAccount(
          {
            ...item,
            slug: tokenObj.abbr,
            coinId: tokenObj.id,
            parentCoinId: item.coinId
          },
          {
            isRefresh: true,
            module: 'default'
          }
        );
      }
    }
    const returnObj: { after?: number; afterToken?: number } = {};
    if (moreParent || moreToken) {
      if (rawHistory.length > 0)
        returnObj.after = rawHistory[rawHistory.length - 1].blockNumber;
      if (erc20history.length > 0)
        returnObj.afterToken =
          erc20history[erc20history.length - 1].blockNumber;
    }
    return returnObj.after || returnObj.afterToken ? returnObj : undefined;
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
      const fees = new BigNumber(ele.tokens_burnt || 0)
        .plus(ele.receipt_conversion_tokens_burnt || 0)
        .plus(ele.nested_receipts_tokens_burnt || 0);

      const fromAddr = ele.signer_account_id;
      const toAddr = ele.receiver_account_id;
      const address = ele.address_parameter;

      const selfTransfer = fromAddr === toAddr;
      const amount = String(ele.args?.deposit || 0);
      const isAddAccountTransaction =
        ele.action_kind === 'FUNCTION_CALL' &&
        ele.args?.method_name === 'create_account';
      let description;
      let argsJson;
      if (isAddAccountTransaction) {
        argsJson = JSON.parse(
          Buffer.from(ele.args?.args_base64 || '', 'base64').toString()
        );
        description = `Created account ${argsJson.new_account_id}`;
      }
      const txn: Transaction = {
        accountId: item.accountId,
        coinId: item.coinId,
        parentCoinId: item.coinId,
        isSub: false,
        hash: ele.transaction_hash,
        customIdentifier: address,
        amount: selfTransfer ? '0' : amount,
        fees: fees.toString(),
        total: new BigNumber(amount).plus(fees).toString(),
        confirmations: 0,
        walletId: item.walletId,
        slug: item.coinType,
        status: ele.status ? 1 : 2,
        sentReceive:
          address === fromAddr ? SentReceive.SENT : SentReceive.RECEIVED,
        confirmed: new Date(
          parseInt(ele.block_timestamp, 10) / 1000000
        ).toISOString(), //conversion from timestamp in nanoseconds
        blockHeight: parseInt(ele.block_height, 10) || 0,
        coin: item.coinType,
        inputs: [
          {
            address: fromAddr,
            value: amount,
            indexNumber: 0,
            isMine: address === fromAddr,
            type: IOtype.INPUT
          }
        ],
        outputs: [
          {
            address: isAddAccountTransaction
              ? argsJson?.new_account_id
              : toAddr,
            value: amount,
            indexNumber: 0,
            isMine: address === toAddr,
            type: IOtype.OUTPUT
          }
        ],
        type: ele.action_kind,
        description
      };
      history.push(txn);
      if (isAddAccountTransaction) {
        const newAccountAddress = argsJson?.new_account_id;
        const addAccountTxn: Transaction = {
          accountId: item.accountId,
          coinId: item.coinId,
          parentCoinId: item.coinId,
          isSub: false,
          hash: ele.transaction_hash,
          customIdentifier: newAccountAddress,
          amount,
          fees: fees.toString(),
          total: new BigNumber(amount).plus(fees).toString(),
          confirmations: 0,
          walletId: item.walletId,
          slug: item.coinType,
          status: ele.status ? 1 : 2,
          sentReceive: SentReceive.RECEIVED,
          confirmed: new Date(
            parseInt(ele.block_timestamp, 10) / 1000000
          ).toISOString(), //conversion from timestamp in nanoseconds
          blockHeight: 0,
          coin: item.coinType,
          inputs: [
            {
              address: fromAddr,
              value: amount,
              indexNumber: 0,
              isMine: newAccountAddress === fromAddr,
              type: IOtype.INPUT
            }
          ],
          outputs: [
            {
              address: newAccountAddress,
              value: amount,
              indexNumber: 0,
              isMine: true,
              type: IOtype.OUTPUT
            }
          ],
          type: ele.action_kind,
          description
        };
        history.push(addAccountTxn);
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
    if (more && rawHistory) {
      return {
        after: rawHistory[rawHistory.length - 1].block_height
      };
    }
  }

  if (coinData instanceof SolanaCoinData) {
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
      if (ele.transaction?.message?.instructions?.length > 0) {
        for (const instruction of ele.transaction.message.instructions) {
          const fees = new BigNumber(ele.meta?.fee || 0);

          const fromAddr = instruction.parsed?.info?.source;
          const toAddr = instruction.parsed?.info?.destination;
          const address = generateSolanaAddressFromXpub(item.xpub);

          const selfTransfer = fromAddr === toAddr;
          const amount = String(instruction.parsed?.info?.lamports || 0);
          const txn: Transaction = {
            accountId: item.accountId,
            coinId: item.coinId,
            parentCoinId: item.coinId,
            isSub: false,
            hash: ele.signature,
            amount: selfTransfer ? '0' : amount,
            fees: fees.toString(),
            total: new BigNumber(amount).plus(fees).toString(),
            confirmations: 1,
            walletId: item.walletId,
            slug: item.coinType,
            status: ele.meta?.err || ele.err ? 2 : 1,
            sentReceive:
              address === fromAddr ? SentReceive.SENT : SentReceive.RECEIVED,
            confirmed: new Date(
              parseInt(ele.blockTime, 10) * 1000
            ).toISOString(), // conversion from timestamp in seconds
            blockHeight: ele.slot,
            coin: item.coinType,
            inputs: [
              {
                address: fromAddr,
                value: amount,
                indexNumber: 0,
                isMine: address === fromAddr,
                type: IOtype.INPUT
              }
            ],
            outputs: [
              {
                address: toAddr,
                value: amount,
                indexNumber: 0,
                isMine: address === toAddr,
                type: IOtype.OUTPUT
              }
            ],
            type: instruction.parsed?.type
          };
          history.push(txn);
        }
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
    if (more && rawHistory) {
      return {
        before: rawHistory[rawHistory.length - 1].signature,
        until: item.afterHash
      };
    }
  }
};
