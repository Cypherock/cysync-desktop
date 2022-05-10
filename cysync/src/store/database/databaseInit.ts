import {
  AddressDB,
  CoinDb2,
  DeviceDB,
  DeviceDb2,
  Erc20DB,
  LatestPriceDB,
  NotificationDB,
  PassEncrypt,
  PriceDB,
  ReceiveAddressDB,
  ReceiveAddressDb2,
  SendAddressDb,
  TokenDb2,
  TransactionDB,
  TransactionDb2,
  WalletDB,
  WalletDb2,
  XpubDB
} from '@cypherock/database';

import { getAnalyticsId } from '../../utils/analytics';

const dbPath = process.env.userDataPath;

export const passEnDb = new PassEncrypt(getAnalyticsId());

export const priceDb = new PriceDB(dbPath);
export const latestPriceDb = new LatestPriceDB(dbPath);
export const xpubDb = new XpubDB(dbPath, passEnDb);
export const transactionDb = new TransactionDB(dbPath);
export const walletDb = new WalletDB(dbPath);
export const erc20tokenDb = new Erc20DB(dbPath);
export const addressDb = new AddressDB(dbPath);
export const receiveAddressDb = new ReceiveAddressDB(dbPath);
export const notificationDb = new NotificationDB(dbPath);
export const deviceDb = new DeviceDB(dbPath);

export const deviceDb2 = new DeviceDb2();
export const walletDb2 = new WalletDb2();
export const coinDb = new CoinDb2(passEnDb);
export const tokenDb = new TokenDb2();
export const sendAddressDb = new SendAddressDb();
export const receiveAddressDb2 = new ReceiveAddressDb2();
export const transactionDb2 = new TransactionDb2();
/**
 * Loads the data from disk. To be used only for encrypted databases.
 */
export const loadDatabases = async () => {
  await xpubDb.loadData();
};

export * from '@cypherock/database';
