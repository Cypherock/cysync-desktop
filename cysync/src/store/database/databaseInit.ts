import {
  AddressDB,
  DeviceDB,
  Erc20DB,
  NotificationDB,
  PassEncrypt,
  PriceDB,
  ReceiveAddressDB,
  TransactionDB,
  WalletDB,
  XpubDB
} from '@cypherock/database';

import { getAnalyticsId } from '../../utils/analytics';

const dbPath = process.env.userDataPath;

export const passEnDb = new PassEncrypt(getAnalyticsId());

export const priceDb = new PriceDB(dbPath);
export const xpubDb = new XpubDB(dbPath, passEnDb);
export const transactionDb = new TransactionDB(dbPath);
export const walletDb = new WalletDB(dbPath);
export const erc20tokenDb = new Erc20DB(dbPath);
export const addressDb = new AddressDB(dbPath);
export const receiveAddressDb = new ReceiveAddressDB(dbPath);
export const notificationDb = new NotificationDB(dbPath);
export const deviceDb = new DeviceDB(dbPath);

/**
 * Loads the data from disk. To be used only for encrypted databases.
 */
export const loadDatabases = async () => {
  await xpubDb.loadData();
};

export * from '@cypherock/database';
