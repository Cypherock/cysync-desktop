import logger from '../../../utils/logger';
import {
  Account,
  AccountDB,
  Address,
  AddressDB,
  CoinPrice,
  CoinPriceDB,
  CustomAccount,
  CustomAccountDB,
  PriceHistory,
  PriceHistoryDB,
  ReceiveAddress,
  ReceiveAddressDB,
  Token,
  TokenDB,
  Transaction,
  TransactionDB
} from '../databaseInit';

import { MigrationFunction } from './types';

const removeInvalidIds: MigrationFunction = async params => {
  try {
    const {
      accountDb,
      coinPriceDb,
      customAccountDb,
      receiveAddressDb,
      transactionDb,
      priceHistoryDb,
      tokenDb,
      addressDb
    } = params;

    const dbs = [
      {
        db: accountDb,
        version: 'v1',
        getId: (el: Account) => AccountDB.buildAccountIndex(el)
      },
      {
        db: coinPriceDb,
        version: 'v1',
        getId: (el: CoinPrice) => CoinPriceDB.buildIndexString(el.coinId)
      },
      {
        db: customAccountDb,
        version: 'v2',
        getId: (el: CustomAccount) =>
          CustomAccountDB.buildIndexString(
            el.walletId,
            el.coin,
            el.name,
            el.accountId,
            el.coinId
          )
      },
      {
        db: receiveAddressDb,
        version: 'v2',
        getId: (el: ReceiveAddress) =>
          ReceiveAddressDB.buildIndexString(el.accountId)
      },
      {
        db: transactionDb,
        version: 'v3',
        getId: (el: Transaction) =>
          TransactionDB.buildIndexString(
            el.hash,
            el.customIdentifier,
            el.coinId,
            el.parentCoinId,
            el.accountId
          )
      },
      {
        db: priceHistoryDb,
        version: 'v2',
        getId: (el: PriceHistory) =>
          PriceHistoryDB.buildIndexString(el.coinId, el.interval)
      },
      {
        db: tokenDb,
        version: 'v2',
        getId: (el: Token) => TokenDB.buildIndexString(el.accountId, el.coinId)
      },
      {
        db: addressDb,
        version: 'v2',
        getId: (el: Address) =>
          AddressDB.buildIndexString(el.accountId, el.address)
      }
    ];

    for (const dbObj of dbs) {
      const dbItems = await dbObj.db.getAll({ databaseVersion: dbObj.version });

      const newDbItems = [];
      let rebuildRequired = false;

      for (const item of dbItems) {
        const itemId = dbObj.getId(item as any);
        if (item._id !== itemId) {
          newDbItems.push({ ...item, _id: itemId });
          rebuildRequired = true;
        } else {
          newDbItems.push(item);
        }
      }

      if (rebuildRequired) {
        await dbObj.db.delete({ databaseVersion: dbObj.version });
        await dbObj.db.insertMany(newDbItems as any);
      }
    }
  } catch (error) {
    logger.error('Error in removing invalid ids from database');
    logger.error(error);
  }
};

export default removeInvalidIds;
