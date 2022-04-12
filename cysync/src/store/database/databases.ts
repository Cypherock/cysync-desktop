import {
  AddressDB,
  DeviceDB,
  Erc20DB,
  LatestPriceDB,
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

const passEnDb = new PassEncrypt(getAnalyticsId());

const priceDb = new PriceDB(dbPath);
const xpubDb = new XpubDB(dbPath, passEnDb);
const transactionDb = new TransactionDB(dbPath);
const walletDb = new WalletDB(dbPath);
const erc20tokenDb = new Erc20DB(dbPath);
const addressDb = new AddressDB(dbPath);
const receiveAddressDb = new ReceiveAddressDB(dbPath);
const notificationDb = new NotificationDB(dbPath);
const deviceDb = new DeviceDB(dbPath);
const latestPriceDb = new LatestPriceDB(dbPath);

export const dbs = {
  priceDb,
  latestPriceDb,
  xpubDb,
  transactionDb,
  walletDb,
  erc20tokenDb,
  addressDb,
  receiveAddressDb,
  notificationDb,
  deviceDb,
  passEnDb
};
