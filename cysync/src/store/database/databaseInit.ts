import {
  AccountDB,
  AddressDB,
  CoinDB,
  CoinPriceDB,
  CustomAccountDB,
  DeviceDB,
  NotificationDB,
  PassEncrypt,
  PriceHistoryDB,
  ReceiveAddressDB,
  TokenDB,
  TransactionDB,
  WalletDB
} from '@cypherock/database';

import { getAnalyticsId } from '../../utils/analytics';
import logger from '../../utils/logger';

import migrationFunctions from './migrations';

export const passEnDb = new PassEncrypt(getAnalyticsId());

export const deviceDb = new DeviceDB();
export const walletDb = new WalletDB();
export const coinDb = new CoinDB(passEnDb);
export const tokenDb = new TokenDB();
export const customAccountDb = new CustomAccountDB();
export const addressDb = new AddressDB();
export const receiveAddressDb = new ReceiveAddressDB();
export const transactionDb = new TransactionDB();
export const notificationDb = new NotificationDB();
export const priceHistoryDb = new PriceHistoryDB();
export const accountDb = new AccountDB();
export const coinPriceDb = new CoinPriceDB();

export * from '@cypherock/database';

const initializeDatabases = async () => {
  await transactionDb.intialise();
  await notificationDb.intialise();
  await priceHistoryDb.intialise();
  await deviceDb.intialise();
  await walletDb.intialise();
  await coinDb.intialise();
  await tokenDb.intialise();
  await customAccountDb.intialise();
  await addressDb.intialise();
  await receiveAddressDb.intialise();
};

export const initDatabases = async () => {
  await initializeDatabases();
  for (const func of migrationFunctions) {
    try {
      await func({
        coinDb,
        priceHistoryDb,
        tokenDb,
        addressDb,
        receiveAddressDb,
        transactionDb,
        customAccountDb,
        notificationDb,
        walletDb,
        deviceDb,
        accountDb,
        coinPriceDb
      });
    } catch (error) {
      logger.error('Migration of database failed: ' + func.name);
      logger.error(error);
    }
  }
};
